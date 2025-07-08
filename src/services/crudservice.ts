import { AppError } from '@/utils/errors';
import { HttpStatus } from '@/utils/constants';
import { logger } from '@/utils/logger';

export class CrudService<T> {
  private model: any;

  constructor(model: any) {
    this.model = model;
  }

  async create(data: T): Promise<T> {
    try {
      const record = await this.model.create({ data });
      logger.info('Record created successfully', { id: (record as any).id });
      return record;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === HttpStatus.UNIQUE_CONTRAINT_FAILED) {
        logger.error('Unique constraint violation', { error });
        throw new AppError('Unique constraint violation', HttpStatus.BAD_REQUEST);
      }else{
        logger.error('Failed to create record', { error });
        throw new AppError('Failed to create record', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async findMany(): Promise<T[]> {
    try {
      const records = await this.model.findMany();
      logger.info(`Retrieved ${records.length} records`);
      return records;
    } catch (error) {
      logger.error('Failed to fetch records', { error });
      throw new AppError('Failed to fetch records', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findUnique(id: string): Promise<T | null> {
    try {
      const record = await this.model.findUnique({ where: { id } });
      if (record) {
        logger.info('Record retrieved successfully', { id });
      } else {
        logger.warn('Record not found', { id });
      }
      return record;
    } catch (error) {
      logger.error('Failed to fetch record', { error, id });
      throw new AppError('Failed to fetch record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      logger.debug('Updating record', { id, data });
      const record = await this.model.update({
        where: { id },
        data,
      });
      logger.info('Record updated successfully', { id });
      return record;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === HttpStatus.RECORD_NOT_FOUND) {
        logger.warn('Record not found for update', { id });
        throw new AppError('Record not found', HttpStatus.NOT_FOUND);
      }else{
        logger.error('Failed to update record', { error, id });
        throw new AppError('Failed to update record', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async delete(id: string): Promise<T | null> {
    try {
      logger.debug('Deleting record', { id });
      const record = await this.model.delete({ where: { id } });
      logger.info('Record deleted successfully', { id });
      return record;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === HttpStatus.RECORD_NOT_FOUND) {
        logger.warn('Record not found for deletion', { id });
        throw new AppError('Record not found', HttpStatus.NOT_FOUND);
      }else{
        logger.error('Failed to delete record', { error, id });
        throw new AppError('Failed to delete record', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}