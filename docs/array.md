- push 向数组中追加元素
  ```
	Model.update({‘age’:22}, {’$push’:{‘array’:{’$each’: [1,2,3,4,5]}} }  );
  ```

- addToSet 目前仅在分组查询中用到，暂不支持

- each 每个项目作为单独记录

- pop 根据位置删除元素，项目中未使用，暂不支持
  ```
	Model.update({‘age’:22}, {’$pop’:{‘array’:1} }  );
  ```

- pull 删除数组中满足匹配条件的项
  ```
	Model.update({‘age’:22}, {’$pull’:{‘array’:10} }  );
  ```
