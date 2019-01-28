# mongoose-mysql
Mongoose npm package used for replace of MongoDB with MySQL

## Mappings
- Schema - new mongoose.Schema()
  ```
  {
    f1: {type: String},
    f2: {
      f2c1: String
    },
    f3: [String],
    f4: [{
      f4c1: String
    }],
    f5: Number,
    f6: Date,
    f7: {type: [{type: String}], formatter: new Stringify()},
    f8: {
      id: false,
      f8c1: String
    },
    f9: {
      f9d: {
        f9d1: String
      }
    },
    f10: {
      f10c1: String,
      f10d: {
        f10d1: String
      }
    },
    f11: [{
      f11c1: String,
      f11d: {
        f11d1: String
      }
    }],
    f12 : {type: ObjectId, ref: 'Cat'}
  }
  ```
- Optimize - SchemaUtil.optimizeObject()
  ```
  {
    "f1": {type: String},
    "f2": {
      "type": {
        "f2c1": {type: String}
      }
    },
    "f3": {
      "type": [{type: String}]
    },
    "f4": {
      "type": [{
        "type": {
          "f4c1": {type: String}
        }
      }]
    },
    "f5": {type: Number},
    "f6": {type: Date},
    "f7": {
      "type": [{type: String}],
      "formatter": new Stringify()
    },
    "f8": {
      "type": {
        "f8c1": {type: String}
      },
      "_id": false
    },
    "f9": {
      "type": {
        "f9d": {
          "type": {
            "f9d1": {type: String}
          }
        }
      }
    },
    "f10": {
      "type": {
        "f10c1": {type: String},
        "f10d": {
          "type": {
            "f10d1": {type: String}
          }
        }
      }
    },
    "f11": {
      "type": [{
        "type": {
          "f11c1": {type: String},
          "f11d": {
            "type": {
              "f11d1": {type: String}
            }
          }
        }
      }]
    },
    "f12": {
      "type": ObjectId,
      "ref": "Cat"
    }
  }
  ```
- DDL - Model.ddl(false).join('\n')
  ```
  create table `cat-f2` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f2c1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f3` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `value` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f4` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f4c1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f8` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f8c1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f9-f9d` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f9d1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f9` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f10-f10d` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f10d1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f10` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f10c1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f11-f11d` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f11d1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat-f11` (
    `autoId` int(11) NOT NULL DEFAULT '0',
    `autoIndex` varchar(255) NOT NULL DEFAULT '',
    `f11c1` varchar(255) NULL,
    PRIMARY KEY (`autoId`, `autoIndex`)
  );
  create table `cat` (
    `_id` int(11) NOT NULL AUTO_INCREMENT,
    `f1` varchar(255) NULL,
    `f5` double NULL,
    `f6` datetime NULL,
    `f7` text NULL,
    `f12` int(11) NULL,
    PRIMARY KEY (`_id`)
  );
  ```
- Data - new Model()
  ```
  {
    f1: 'f1-test',
    f2: {
      f2c1: 'f2-c1'
    },
    f3: ['f3-1', 'f3-2', 'f3-3'],
    f4: [{
      f4c1: 'f4c1-1'
    }, {
      f4c1: 'f4c1-2'
    }],
    f5: Math.random() * 100,
    f6: new Date(),
    f7: ['f7-1', 'f7-2'],
    f8: {
      f8c1: 'f8c1'
    },
    f9: {
      f9d: {
        f9d1: 'f9d1-String'
      }
    },
    f10: {
      f10c1: 'f10c1-String',
      f10d: {
        f10d1: 'f10d1-String'
      }
    },
    f11: [{
      f11c1: 'f11c1-String',
      f11d: {
        f11d1: 'f11d1-sss'
      }
    }],
    f12: Math.random() * 1000 + 1
  }
  ```
- SQL - SchemaUtil.insert()
  ```
  [
    {
      "sql": "insert into `cat` (`_id`,`f1`,`f5`,`f6`,`f7`,`f12`) values (?,?,?,?,?,?)",
      "data": [
        null,
        "f1-test",
        71.6115654067748,
        "2019-01-28T01:09:51.330Z",
        "[\"f7-1\",\"f7-2\"]",
        891.3473039955556
      ]
    },
    {
      "sql": "insert into `cat-f2` (`autoId`,`autoIndex`,`f2c1`) values (?,?,?)",
      "data": [
        null,
        "f2",
        "f2-c1"
      ]
    },
    {
      "sql": "insert into `cat-f3` (`autoId`,`autoIndex`,`value`) values (?,?,?)",
      "data": [
        null,
        "f3.0",
        "f3-1"
      ]
    },
    {
      "sql": "insert into `cat-f3` (`autoId`,`autoIndex`,`value`) values (?,?,?)",
      "data": [
        null,
        "f3.1",
        "f3-2"
      ]
    },
    {
      "sql": "insert into `cat-f3` (`autoId`,`autoIndex`,`value`) values (?,?,?)",
      "data": [
        null,
        "f3.2",
        "f3-3"
      ]
    },
    {
      "sql": "insert into `cat-f4` (`autoId`,`autoIndex`,`f4c1`) values (?,?,?)",
      "data": [
        null,
        "f4.0",
        "f4c1-1"
      ]
    },
    {
      "sql": "insert into `cat-f4` (`autoId`,`autoIndex`,`f4c1`) values (?,?,?)",
      "data": [
        null,
        "f4.1",
        "f4c1-2"
      ]
    },
    {
      "sql": "insert into `cat-f8` (`autoId`,`autoIndex`,`f8c1`) values (?,?,?)",
      "data": [
        null,
        "f8",
        "f8c1"
      ]
    },
    {
      "sql": "insert into `cat-f9` (`autoId`,`autoIndex`) values (?,?)",
      "data": [
        null,
        "f9"
      ]
    },
    {
      "sql": "insert into `cat-f9-f9d` (`autoId`,`autoIndex`,`f9d1`) values (?,?,?)",
      "data": [
        null,
        "f9.f9d",
        "f9d1-String"
      ]
    },
    {
      "sql": "insert into `cat-f10` (`autoId`,`autoIndex`,`f10c1`) values (?,?,?)",
      "data": [
        null,
        "f10",
        "f10c1-String"
      ]
    },
    {
      "sql": "insert into `cat-f10-f10d` (`autoId`,`autoIndex`,`f10d1`) values (?,?,?)",
      "data": [
        null,
        "f10.f10d",
        "f10d1-String"
      ]
    },
    {
      "sql": "insert into `cat-f11` (`autoId`,`autoIndex`,`f11c1`) values (?,?,?)",
      "data": [
        null,
        "f11.0",
        "f11c1-String"
      ]
    },
    {
      "sql": "insert into `cat-f11-f11d` (`autoId`,`autoIndex`,`f11d1`) values (?,?,?)",
      "data": [
        null,
        "f11.0.f11d",
        "f11d1-sss"
      ]
    }
  ]
  ```
