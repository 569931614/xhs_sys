import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { XhsService } from './xhs.service';
import { XhsPost } from './xhs.entity';
import { XhsActivityPost } from './xhs-activity-post.entity';
import { CreateXhsPostDto } from './dto/xhs.dto';

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    delete: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

describe('XhsService', () => {
  let service: XhsService;
  let xhsPostRepository: Repository<XhsPost>;
  let xhsActivityPostRepository: Repository<XhsActivityPost>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XhsService,
        {
          provide: getRepositoryToken(XhsPost),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(XhsActivityPost),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<XhsService>(XhsService);
    xhsPostRepository = module.get<Repository<XhsPost>>(getRepositoryToken(XhsPost));
    xhsActivityPostRepository = module.get<Repository<XhsActivityPost>>(getRepositoryToken(XhsActivityPost));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a post without activity ID', async () => {
      const userId = 1;
      const createXhsPostDto: CreateXhsPostDto = {
        title: 'Test Post',
        content: 'Test Content',
        type: 'normal',
        images: [],
      };
      const savedPost = { id: 1, ...createXhsPostDto, userId };

      jest.spyOn(xhsPostRepository, 'create').mockReturnValue(savedPost as any);
      mockQueryRunner.manager.save.mockResolvedValueOnce(savedPost);

      const result = await service.create(createXhsPostDto, userId);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(xhsPostRepository.create).toHaveBeenCalledWith({
        ...createXhsPostDto,
        userId,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(savedPost);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(savedPost);
    });

    it('should create a post with activity ID and create relation', async () => {
      const userId = 1;
      const activityId = 2;
      const createXhsPostDto: CreateXhsPostDto = {
        title: 'Test Post',
        content: 'Test Content',
        type: 'normal',
        images: [],
        activityId,
      };
      const savedPost = { id: 1, ...createXhsPostDto, userId };
      const activityPost = { postId: 1, activityId };

      jest.spyOn(xhsPostRepository, 'create').mockReturnValue(savedPost as any);
      jest.spyOn(xhsActivityPostRepository, 'create').mockReturnValue(activityPost as any);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(savedPost)
        .mockResolvedValueOnce(activityPost);

      const result = await service.create(createXhsPostDto, userId);

      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(xhsPostRepository.create).toHaveBeenCalledWith({
        ...createXhsPostDto,
        userId,
      });
      expect(xhsActivityPostRepository.create).toHaveBeenCalledWith({
        postId: savedPost.id,
        activityId,
      });
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(savedPost);
    });
  });
}); 