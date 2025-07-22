import { CreateXhsPostDto } from './dto/xhs.dto';

export const testPosts: CreateXhsPostDto[] = [
  {
    type: 'normal',
    title: '测试帖子1',
    content: '这是第一个测试帖子的内容，用于测试小红书功能。',
    images: [
      'https://example.com/image1-1.jpg',
      'https://example.com/image1-2.jpg',
      'https://example.com/image1-3.jpg',
    ],
    video: 'https://example.com/video1.mp4',
    cover: 'https://example.com/cover1.jpg',
    identifier: 'test1',
  },
  {
    type: 'video',
    title: '测试帖子2',
    content: '这是第二个测试帖子的内容，用于测试小红书功能。',
    images: [
      'https://example.com/image2-1.jpg',
      'https://example.com/image2-2.jpg',
    ],
    video: 'https://example.com/video2.mp4',
    cover: 'https://example.com/cover2.jpg',
    identifier: 'test2',
  },
  {
    type: 'normal',
    title: '测试帖子3',
    content: '这是第三个测试帖子的内容，用于测试小红书功能。',
    images: [
      'https://example.com/image3-1.jpg',
      'https://example.com/image3-2.jpg',
      'https://example.com/image3-3.jpg',
      'https://example.com/image3-4.jpg',
    ],
    video: 'https://example.com/video3.mp4',
    cover: 'https://example.com/cover3.jpg',
    identifier: 'test3',
  },
]; 