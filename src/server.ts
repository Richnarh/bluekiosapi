import app from '@/app';
import { logger } from './utils/logger';
const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   logger.info(`Server is running at http://localhost:${PORT}`);
// });

const startEngine = async () => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}
startEngine().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});