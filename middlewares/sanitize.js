const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Sanitizes input from request body.
 * @param {string} field - The name of the field to sanitize.
 * @returns {Function} Express-validator middleware function.
 */
const sanitizeInput = (field) => 
    body(field).trim().escape();

/**
 * Sanitizes input from request parameters.
 * @param {string} field - The name of the parameter to sanitize.
 * @returns {Function} Express-validator middleware function.
 */
const sanitizeParam = (field) => 
    param(field).trim().escape();

/**
 * Sanitizes input from query string.
 * @param {string} field - The name of the query parameter to sanitize.
 * @returns {Function} Express-validator middleware function.
 */
const sanitizeQuery = (field) => 
    query(field).trim().escape();

/**
 * Validates if a given field is a valid MongoDB ObjectId.
 * @param {string} field - The name of the field to validate.
 * @returns {Function} Express-validator middleware function.
 */
const validateObjectId = (field) => 
    body(field).custom((value) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
            throw new Error('Invalid ObjectId');
        }
        return true;
    });

module.exports = {
    sanitizeInput,
    sanitizeParam,
    sanitizeQuery,
    validateObjectId
};
