/**
 * CHRONOS - The Archaeologist
 *
 * Entry point for the Git + AST parsing system.
 */

export * from './parser/GitParser.js';
export * from './parser/ASTParser.js';
export * from './analyzer/ComplexityAnalyzer.js';
export * from './analyzer/HotspotDetector.js';

console.log('📜 CHRONOS initialized - Ready to parse codebases');
