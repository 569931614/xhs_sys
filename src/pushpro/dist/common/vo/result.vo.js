"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
class Result {
    static success(data = null, message = 'success') {
        return {
            success: true,
            code: 200,
            message,
            data,
        };
    }
    static fail(message = 'fail', code = 400, data = null) {
        return {
            success: false,
            code,
            message,
            data,
        };
    }
}
exports.Result = Result;
