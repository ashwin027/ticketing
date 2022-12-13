"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotAuthorizedError = void 0;
const custom_erorr_1 = require("./custom-erorr");
class NotAuthorizedError extends custom_erorr_1.CustomError {
    constructor() {
        super('Not authorized');
        this.statusCode = 401;
        Object.setPrototypeOf(this, NotAuthorizedError.prototype);
    }
    serializeErrors() {
        return [{ message: 'Not authorized' }];
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
