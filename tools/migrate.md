# migrate

中间件迁移说明

## 迁移脚本
- 切换到mongoose-mysql-migrate分支，migrate.js以原始项目的mongoose的schema为基础进行迁移
- 通过修改迁移脚本处理mongoose与mysql之间的schema差异
- 数据迁移完成后会将schema调整为mysql版，之后再执行迁移可能会出现异常

## 代码调整
- 将```require('mongoose')```替换为```require('mongoose-mysql')```，中间件路径以实际情况为准
- 使用db.collection()之前需要先引入模型，以便生成映射关系
- 暂不支持整体更新数组类型表，可将单值数组调整为JSON存储（formatter: new mongoose.Schema.Formatter.Stringify()）
- 将关联字段类型为String的修改为ObjectID类型，同时指定ref，在迁移时可自动更新

## 业务调整
