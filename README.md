# mongoose-mysql
Mongoose for MySQL used for replace of MongoDB

## Schema
- userCode: { type: String, unique: true, required: true }, // 唯一、必填约束，通过移除保留关键字判断字段是否为文档类型
- agentId: { type: ObjectId, ref: 'agentbroker'}, // 外键，通过populate调取关联记录
  ```
  populate('agentId')
  populate({path: 'agentId', select:{'channelType': 1, 'agentName': 1, agentType: 1}})
  populate([{ path: 'ownAgentId', select: 'agentName' }, { path: 'contractId', select: 'contractNo' }])
  populate({path: 'agentId', select: '_id agentName contractMobile'})
  ```
- createdAt: { type: Date, default: Date.now }, // 类型和默认值设置，容易存在歧义的地方
- files: [{id|_id: false, name: String, elecUrl: String}], // 不自动生成ID
- totalGold: {type: Number, default: 0, set: base.capitalize}, // 自定义赋值
  ```
  exports.capitalize = function (val) {
    //数据库格式化
    if (val) {
        return parseFloat(val).toFixed(2);
    } else {
        return 0.00;
    }
  };
  ```
- allotMode: {type: String, enum: ["0", "1"]}, // 枚举
