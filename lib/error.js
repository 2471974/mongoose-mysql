'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
class Error {}

Error.messages = {
    general: {
        required: '{PATH}必须录入'
    },
    String: {
        enum: '{PATH}输入的不是可用值',
        match: '{PATH}输入的值格式不正确'
    },
    Number: {
        min: '项`{PATH}`的值 ({VALUE}) 不能小于最小值 ({MIN})',
        max: '项`{PATH}`的值 ({VALUE}) 不能大于最大值 ({MAX})'
    }
};

exports.default = Error;