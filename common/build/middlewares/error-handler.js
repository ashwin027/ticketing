"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const custom_erorr_1 = require("../errors/custom-erorr");
const errorHandler = (err, req, res, next) => {
    if (err instanceof custom_erorr_1.CustomError) {
        return res.status(err.statusCode).send({ errors: err.serializeErrors() });
    }
    console.error(err);
    res.status(400).send({
        errors: [{ message: 'Something went wrong.' }]
    });
};
exports.errorHandler = errorHandler;
