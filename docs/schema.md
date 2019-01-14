```JSON
{
	f1: String,
	f2: {
		f2c1: String
	}
	f3: [String],
	f4: [{
		f4c1: String
	}]
	f5: Number,
	f6: Date,
	f7: Stringify,
	f8: {
		id: false,
		f8c1: String
	}
}
```

- 子文档的表名称、列名称映射方式
- 子文档数组的表名称、列名称映射方式，是否需要支持按数据索引方式查询
- 基础数据类型数组的映射方式，字段名称命名方式
- 新增Stringify数据类型，不支持查询，仅提供存取转换，需要修改Schema并于MySQL表结构对应
- 数据类型Number、Date的格式是否需要在Schema中体现
- 如何处理_id: false的主键，子文档的主键在业务中的使用方式

```
表t
_id, f1, f5, f6, f7

表t-f3
autoId, autoIndex, value

表t-f2
autoId, autoIndex, f2c1

表t-f4
autoId, autoIndex, f4c1
```

- autoId 为所属文档主键，子文档主键 = autoId + autoIndex
- autoIndex 为数据项在文档中的位置信息，如'0','f1','f1.0','f1.0.fx','f1.0.fx.0'
