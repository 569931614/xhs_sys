const mysql = require('mysql2/promise');
const axios = require('axios');

// 创建MySQL连接池
const dbPool = mysql.createPool({
  host: '47.238.216.176',
  port: 3306,
  user: 'dy_aivip1_top',
  password: 'kVXFBGw0BO40800b',
  database: 'dy_aivip1_top',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * 创建账号分析任务
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.createTask = async (req, res) => {
  try {
    const { platform, type_name, user_id, link, mode } = req.body;
    
    if (!platform || !type_name || !user_id || !link) {
      return res.json({
        success: false,
        message: '参数不完整',
        code: 400
      });
    }
    
    let apiUrl = 'https://dy.aivip1.top/pc/api/create_fx_task.php';
    let apiData;
    
    if (platform === 'douyin') {
      apiData = {
        user_id: user_id.toString(),
        douyinLink: link,
        selectedMode: mode || '10'
      };
    } else if (platform === 'xiaohongshu') {
      apiData = {
        type_name: '小红书',
        user_id: user_id.toString(),
        douyinLink: link,
        selectedMode: mode || '1'
      };
    } else {
      return res.json({
        success: false,
        message: '不支持的平台类型',
        code: 400
      });
    }
    
    console.log('发送分析请求:', apiUrl, apiData);
    
    // 发送请求到分析API
    const apiResponse = await axios.post(apiUrl, apiData, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://dy.aivip1.top',
        'referer': 'https://dy.aivip1.top/pc/home',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
      }
    });
    
    if (!apiResponse.data.success) {
      return res.json({
        success: false,
        message: apiResponse.data.message || '创建分析任务失败',
        code: 500
      });
    }
    
    const taskData = apiResponse.data.data;
    
    // 将任务信息保存到数据库
    const connection = await dbPool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO la_fx_task (user_id, type_name, task_id, fx_url, timeout, status, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [user_id, type_name, taskData.task_id, link, taskData.timeout || 1, '进行中']
      );
      
      return res.json({
        success: true,
        message: '创建分析任务成功',
        data: {
          id: result.insertId,
          ...taskData
        },
        code: 200
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('创建分析任务出错:', error);
    return res.json({
      success: false,
      message: '创建分析任务出错: ' + (error.message || '未知错误'),
      code: 500
    });
  }
};

/**
 * 获取用户的分析任务列表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getTasks = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.json({
        success: false,
        message: '用户ID不能为空',
        code: 400
      });
    }
    
    // 查询数据库中的任务
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM la_fx_task WHERE user_id = ? ORDER BY create_time DESC',
        [user_id]
      );
      
      return res.json({
        success: true,
        message: '获取分析任务列表成功',
        data: rows,
        code: 200
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取分析任务列表出错:', error);
    return res.json({
      success: false,
      message: '获取分析任务列表出错: ' + (error.message || '未知错误'),
      code: 500
    });
  }
};

/**
 * 获取分析任务结果
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.getTaskResult = async (req, res) => {
  try {
    const { task_id } = req.query;
    
    if (!task_id) {
      return res.json({
        success: false,
        message: '任务ID不能为空',
        code: 400
      });
    }
    
    // 查询数据库中的任务结果
    const connection = await dbPool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM la_fx_task WHERE task_id = ?',
        [task_id]
      );
      
      if (rows.length === 0) {
        return res.json({
          success: false,
          message: '未找到该分析任务',
          code: 404
        });
      }
      
      const task = rows[0];
      
      // 检查任务是否已完成
      if (task.status !== '已完成') {
        // 更新任务状态
        const apiUrl = 'https://dy.aivip1.top/pc/api/get_fx_task.php';
        const apiResponse = await axios.get(`${apiUrl}?task_id=${task_id}`, {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9',
            'origin': 'https://dy.aivip1.top',
            'referer': 'https://dy.aivip1.top/pc/home',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
          }
        });
        
        if (apiResponse.data.success && apiResponse.data.data) {
          const taskData = apiResponse.data.data;
          
          // 更新数据库中的任务信息
          await connection.execute(
            'UPDATE la_fx_task SET status = ?, fx_content = ?, fx_content_jj = ?, ip_content = ? WHERE task_id = ?',
            [
              taskData.status || task.status,
              taskData.fx_content || task.fx_content,
              taskData.fx_content_jj || task.fx_content_jj,
              taskData.ip_content || task.ip_content,
              task_id
            ]
          );
          
          // 重新查询更新后的任务
          const [updatedRows] = await connection.execute(
            'SELECT * FROM la_fx_task WHERE task_id = ?',
            [task_id]
          );
          
          if (updatedRows.length > 0) {
            return res.json({
              success: true,
              message: '获取分析任务结果成功',
              data: updatedRows[0],
              code: 200
            });
          }
        }
      }
      
      return res.json({
        success: true,
        message: '获取分析任务结果成功',
        data: task,
        code: 200
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取分析任务结果出错:', error);
    return res.json({
      success: false,
      message: '获取分析任务结果出错: ' + (error.message || '未知错误'),
      code: 500
    });
  }
}; 