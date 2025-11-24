import { runApiTests } from './modules/api.test';
import { runModalTests } from './modules/modal.test';
import { runErrorHandlerTests } from './modules/errorHandler.test';
import { runOutputFormatterTests } from './modules/outputFormatter.test';

// Run all test modules
runApiTests();
runModalTests();
runErrorHandlerTests();
runOutputFormatterTests();