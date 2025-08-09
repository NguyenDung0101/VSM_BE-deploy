import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export abstract class BaseService<T> {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly entityName: string,
    private readonly modelName: string,
  ) {}

  /**
   * Get all entities with pagination and optional filtering
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    page?: number;
    limit?: number;
    where?: any;
    include?: any;
    orderBy?: any;
  } = {}) {
    try {
      const { 
        where = {}, 
        include, 
        orderBy = { createdAt: 'desc' },
        page = 1,
        limit = 10,
        skip,
        take 
      } = params;

      // Use skip/take directly if provided, otherwise calculate from page/limit
      const skipValue = skip !== undefined ? skip : (page - 1) * limit;
      const takeValue = take !== undefined ? take : limit;

      // Use dynamic property access for model name
      const model = this.prisma[this.modelName];
      
      const [items, total] = await Promise.all([
        model.findMany({
          where,
          include,
          orderBy,
          skip: skipValue,
          take: takeValue,
        }),
        model.count({ where }),
      ]);

      return {
        data: items,
        meta: {
          total,
          page: page || Math.floor(skipValue / takeValue) + 1,
          limit: takeValue,
          totalPages: Math.ceil(total / takeValue),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve ${this.entityName}s: ${error.message}`);
    }
  }

  /**
   * Get entity by ID
   */
  async findOne(id: string, include?: any) {
    try {
      // Use dynamic property access for model name
      const model = this.prisma[this.modelName];
      
      const entity = await model.findUnique({
        where: { id },
        include,
      });

      if (!entity) {
        throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
      }

      return entity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve ${this.entityName}: ${error.message}`);
    }
  }

  /**
   * Create a new entity
   */
  async create(data: any, include?: any) {
    try {
      // Use dynamic property access for model name
      const model = this.prisma[this.modelName];
      
      return await model.create({
        data,
        include,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create ${this.entityName}: ${error.message}`);
    }
  }

  /**
   * Update an entity by ID
   */
  async update(id: string, data: any, include?: any) {
    try {
      // Verify entity exists
      await this.findOne(id);
      
      // Use dynamic property access for model name
      const model = this.prisma[this.modelName];
      
      return await model.update({
        where: { id },
        data,
        include,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update ${this.entityName}: ${error.message}`);
    }
  }

  /**
   * Delete an entity by ID
   */
  async remove(id: string) {
    try {
      // Verify entity exists
      await this.findOne(id);
      
      // Use dynamic property access for model name
      const model = this.prisma[this.modelName];
      
      return await model.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete ${this.entityName}: ${error.message}`);
    }
  }
} 