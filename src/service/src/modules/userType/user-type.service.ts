import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateUserTypeDto } from './dto/create-user-type.dto';
import { UpdateUserTypeDto } from './dto/update-user-type.dto';
import { UserTypeEntity } from './user-type.entity';

@Injectable()
export class UserTypeService {
  constructor(
    @InjectRepository(UserTypeEntity)
    private readonly userTypeRepository: Repository<UserTypeEntity>,
  ) {}

  // 创建用户类型
  async create(createUserTypeDto: CreateUserTypeDto): Promise<UserTypeEntity> {
    const { name } = createUserTypeDto;
    
    // 检查名称是否已存在
    const existType = await this.userTypeRepository.findOne({ where: { name } });
    if (existType) {
      throw new HttpException('用户类型名称已存在', HttpStatus.BAD_REQUEST);
    }
    
    const newUserType = this.userTypeRepository.create(createUserTypeDto);
    return this.userTypeRepository.save(newUserType);
  }

  // 获取所有用户类型
  async findAll(query: any = {}): Promise<{ list: UserTypeEntity[]; total: number }> {
    const { name, page = 1, size = 10 } = query;
    
    // 构建查询条件
    const where: any = {};
    if (name) {
      where.name = Like(`%${name}%`);
    }
    
    const [list, total] = await this.userTypeRepository.findAndCount({
      where,
      order: { createTime: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });
    
    return { list, total };
  }

  // 获取单个用户类型
  async findOne(id: number): Promise<UserTypeEntity> {
    const userType = await this.userTypeRepository.findOne({ where: { id } });
    if (!userType) {
      throw new HttpException('用户类型不存在', HttpStatus.NOT_FOUND);
    }
    return userType;
  }

  // 更新用户类型
  async update(id: number, updateUserTypeDto: UpdateUserTypeDto): Promise<UserTypeEntity> {
    const userType = await this.findOne(id);
    
    // 如果要更新名称，先检查是否与其他类型重名
    if (updateUserTypeDto.name && updateUserTypeDto.name !== userType.name) {
      const existType = await this.userTypeRepository.findOne({ 
        where: { name: updateUserTypeDto.name } 
      });
      if (existType && existType.id !== id) {
        throw new HttpException('用户类型名称已存在', HttpStatus.BAD_REQUEST);
      }
    }
    
    // 更新数据
    const updatedUserType = this.userTypeRepository.merge(userType, updateUserTypeDto);
    return this.userTypeRepository.save(updatedUserType);
  }

  // 删除用户类型
  async remove(id: number): Promise<void> {
    const userType = await this.findOne(id);
    await this.userTypeRepository.remove(userType);
  }
} 