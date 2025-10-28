import cron from 'node-cron';
import { DataSource, LessThan } from 'typeorm';
import { initializeDatabase } from '../config/dataSource.js';
import { Form } from '../entities/Form.js';
import { AppError } from '../utils/errors.js';
import { HttpStatus } from '../utils/constants.js';

// 🕛 Run every day at midnight
cron.schedule('0 0 * * *', async () => {
    const dataSource: DataSource = await initializeDatabase();
  const formRepository = dataSource.getRepository(Form)
  const now = new Date();

  try {
    const expiredForms = await formRepository.find({
      where: { expiresAt: LessThan(now) },
    });

    if (expiredForms.length > 0) {
      await formRepository.remove(expiredForms);
      console.log(`🧹 Deleted ${expiredForms.length} expired form links`);
    } else {
      console.log('✅ No expired forms found for cleanup');
    }
  } catch (error) {
    console.error('❌ Error while cleaning expired forms:', error);
    throw new AppError(error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
});
