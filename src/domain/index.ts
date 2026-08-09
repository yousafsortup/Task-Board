/**
 * Public surface of the domain layer.
 *
 * Nothing in here imports React, React Native, or any I/O library — that is
 * what makes the business rules genuinely shared across iOS, macOS/desktop
 * and the test runner.
 */
export * from './errors';
export * from './task/task.entity';
export * from './task/task.filter';
export * from './task/task.sort';
export * from './task/task.repository';
