# Sequelize

本文来介绍 Sequelize，一个基于 Node.js 平台的 ORM（对象关系映射）工具，并详细介绍其用法。Sequelize 可以帮助开发者在应用程序中使用 JavaScript 来操作关系型数据库，例如 MySQL、PostgreSQL 等。本文内容很多，可作为一个 Sequelize 的参考手册来使用。

# 开始使用

### 核心概念

Sequelize 是一个基于 JavaScript 的 ORM（对象关系映射）库，用于在 Node.js 环境中与数据库进行交互。它提供了一种方便、灵活的方式来管理数据库，并将数据库表映射为对象，使开发人员可以使用面向对象的编程风格来操作数据库。

ORM（对象关系映射）是一种编程技术，用于通过将对象和数据库表之间建立映射关系，以更直观的方式进行数据库操作。Sequelize 通过将数据库记录映射为模型对象，使得开发人员可以使用 JavaScript 对象的方法和属性来进行数据库的增删改查操作，而不需要编写复杂的 SQL 查询语句。

Sequelize 支持多种数据库，包括 MySQL、PostgreSQL、SQLite 和 MSSQL 等，可以适应各种不同的项目需求。它提供了丰富的功能，包括模型定义、关联关系、事务处理、查询构建器等，可以帮助开发人员高效地进行数据库操作。

使用 Sequelize，开发人员可以轻松地进行数据库迁移、执行复杂的查询和聚合操作，并实现数据校验和验证等功能。此外，它还提供了钩子函数、事件触发和数据库连接池等功能，以优化数据库访问性能。

### 基本使用

要使用 Sequelize 来连接 MySQL 数据库，需要进行以下步骤：

1. 安装 Sequelize 和 MySQL 驱动程序：
   * 使用 npm 运行以下命令来安装 Sequelize：`npm install sequelize`
   * 安装 MySQL：`npm install mysql2`
2. 创建 Sequelize 实例和数据库连接：

```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});
```

这里需要将 `'database'`、`'username'` 和 `'password'` 分别替换为 MySQL 数据库的名称、用户名和密码。还可以根据需要设置其他连接选项，例如 `host` 和 `port`。

3. 定义模型：

```javascript
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  // 其他属性和选项
});
```

这里定义了一个名为 `User` 的模型，包含 `username` 和 `email` 属性。

4. 进行数据库操作：

```javascript
async function createUser() {
  await sequelize.sync(); // 同步模型和数据库

  const user = await User.create({ username: 'John', email: 'john@example.com' });
  console.log(user.toJSON());
}

createUser().catch(console.error);
```

这里首先调用 `sequelize.sync()` 方法来同步模型和数据库，以确保模型在数据库中存在。然后使用 `User.create()` 方法创建一个新用户，并输出其序列化后的 JSON 数据。

这只是 Sequelize 连接 MySQL 的基本用法，你还可以使用 Sequelize 提供的其他方法来执行查询、更新、删除等操作，以及定义模型之间的关联关系。下面会详细介绍！

# 模型定义

在 Sequelize 中，模型（Model）是一种表示数据库表结构的抽象化概念。它定义了数据表的结构和行为，包括表名、字段、关联关系、数据校验规则等。

Sequelize 模型允许通过编写模型类来操作数据库表，封装了对数据库的增删改查等操作。每个模型类对应一个数据库表，并且模型类的实例代表数据库表中的一条记录。

## 创建模型

### 定义模型方法

可以使用`sequelize.define()` 方法来创建模型，它用于定义和创建模型，其基本语法如下：

```javascript
sequelize.define(modelName, attributes, options)
```

参数说明：

* `modelName`：模型的名称。
* `attributes`：模型的属性定义，一个包含列名和数据类型的对象。
* `options`：模型的其他选项，例如表名、时间戳等。

```javascript
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  tableName: 'users',
  timestamps: true,
});

// 创建用户实例
User.create({ username: 'John', email: 'john@example.com' })
  .then((user) => {
    console.log(user.toJSON());
  })
  .catch(console.error);
```

这里使用 `sequelize.define()` 方法定义了一个名为 `User` 的模型。模型具有 `id`、`username`、`email`、`createdAt` 和 `updatedAt` 等属性。我们还指定了表名为 `'users'`，以及启用了时间戳属性。

### 定义模型步骤

在 Sequelize 中，创建模型的步骤如下：

1. 配置 Sequelize 实例连接数据库，确定数据库的相关信息。
2. 使用 `sequelize.define` 方法定义模型，并指定模型的名称、字段和其他选项。
3. 通过调用模型的 `sync` 方法将模型同步到数据库中。

```javascript
const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
  // 配置数据库连接信息
});

// 定义模型
const User = sequelize.define('User', {
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  age: Sequelize.INTEGER,
});

// 同步模型到数据库
(async () => {
  try {
    await sequelize.sync();
    console.log('模型创建成功！');
  } catch (error) {
    console.error('模型创建失败：', error);
  } finally {
    sequelize.close(); // 关闭数据库连接
  }
})();
```

记得在最后关闭 Sequelize 连接，避免资源泄漏。

注意，模型创建后只需调用 `sequelize.sync` 方法进行同步一次即可，后续对模型的修改不会自动同步到数据库。如果想要更新现有的模型定义，可以使用 Sequelize 提供的迁移工具或手动修改数据库表结构。

### 定义模型参数

上面的例子只定义了字段的类型，其实还有很多属性可以定义，下面来看一个例子：

```javascript
const Sequelize = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password', {
  // 配置数据库连接信息
});

const User = sequelize.define('User', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  age: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
});
```

在字段定义对象中，每个属性表示一个字段。属性的名称是字段的名称，属性的值是字段的配置。下面来分别看看这些字段值。

#### type：参数类型

`type` 属性用于指定模型字段的数据类型。以下是一些常见的数据类型选项：

* `STRING`：字符串类型。
* `CHAR`：字符型，允许存储固定长度的字符串。
* `TEXT`：文本类型，适用于存储大段文本数据。
* `INTEGER`：整数类型。
* `BIGINT`：大整数类型。
* `FLOAT`：浮点数类型。
* `DOUBLE`：双精度浮点数类型。
* `DECIMAL`：十进制数类型。
* `BOOLEAN`：布尔类型。
* `DATE`：日期类型，不包括时间。
* `TIME`：时间类型，不包括日期。
* `DATEONLY`：仅日期类型。
* `DATETIME`：日期和时间类型。
* `BLOB`：二进制大对象类型，适用于存储二进制数据。
* `UUID`：通用唯一识别码类型。

此外，Sequelize 还支持将数据类型与修饰符结合使用，以提供更丰富的数据定义选项。例如：

* `STRING(100)`：指定字符串类型的最大长度为 100 个字符。
* `INTEGER.UNSIGNED`：指定无符号整数类型。
* `DECIMAL(10, 2)`：指定十进制数类型，并设置总共10位数，其中包含2位小数。

##### 数字类型

在 Sequelize 中，数字类型包括以下几种：

* INTEGER：表示整数类型。可以使用 `Sequelize.INTEGER` 或 `Sequelize.INTEGER(n)` 来定义，其中 n 是整数的位数。
* BIGINT：表示长整数类型。可以使用 `Sequelize.BIGINT` 或 `Sequelize.BIGINT(n)` 来定义，其中 n 是长整数的位数。
* FLOAT：表示单精度浮点数类型。可以使用 `Sequelize.FLOAT` 或 `Sequelize.FLOAT(n, m)` 来定义，其中 n 是总位数，m 是小数部分的位数。
* DOUBLE：表示双精度浮点数类型。可以使用 `Sequelize.DOUBLE` 或 `Sequelize.DOUBLE(n, m)` 来定义，其中 n 是总位数，m 是小数部分的位数。
* DECIMAL：表示任意精度的十进制数类型。可以使用 `Sequelize.DECIMAL` 或 `Sequelize.DECIMAL(n, m)` 来定义，其中 n 是总位数，m 是小数部分的位数。

##### 字符串类型

在 Sequelize 中，字符串类型有以下几种选项可供选择：

* STRING：表示普通的字符串类型。可以使用 `Sequelize.STRING` 来定义，默认最大长度为 255 个字符。
* CHAR：表示定长的字符串类型。你可以指定最大长度作为选项。可以使用 `Sequelize.CHAR(length)` 来定义，其中 `length` 是字符串的最大长度。
* TEXT：表示长文本类型。可以存储更大长度的文本数据。可以使用 `Sequelize.TEXT` 来定义。
* UUID：表示 UUID 字符串类型，用于存储全局唯一标识符。可以使用 `Sequelize.UUID` 来定义。
* ENUM：表示枚举类型，用于存储预定义的选项列表中的一个值。需要提供一个选项数组作为参数。可以使用 `Sequelize.ENUM(values)` 来定义，其中 `values` 是枚举选项的数组。
* JSON：表示存储 JSON 数据的字符串类型。可以使用 `Sequelize.JSON` 来定义。
* JSONB：表示存储 JSONB（二进制格式的 JSON）数据的字符串类型（仅支持 PostgreSQL）。可以使用 `Sequelize.JSONB` 来定义。

##### 日期类型

在 Sequelize 中，日期类型包括以下几种：

* DATE：表示日期类型，不包含时间。可以使用 `Sequelize.DATE` 来定义。
* TIME：表示时间类型，不包含日期。可以使用 `Sequelize.TIME` 来定义。
* DATETIME：表示日期和时间类型。可以使用 `Sequelize.DATE` 或 `Sequelize.DATETIME` 来定义。
* NOW：表示当前时间。可以使用 `Sequelize.NOW` 来获取当前时间的值。
* DATEONLY：表示只包含日期的类型，不包含时间。可以使用 `Sequelize.DATEONLY` 来定义。
* SMALLDATETIME：表示包含日期和时间的类型，时间精度较低。可以使用 `Sequelize.SMALLDATETIME` 来定义。
* TIMESTAMP：表示包含日期和时间的类型，时间精度高于 SMALLDATETIME。可以使用 `Sequelize.TIMESTAMP` 来定义。

##### UUID类型

在 Sequelize 中，UUID 类型用于表示一个全局唯一的标识符。Sequelize 支持以下几种 UUID 类型：

* UUID：表示标准 UUID 字符串，长度为 36 个字符。可以使用 `Sequelize.UUID` 来定义。
* UUIDV1：表示基于时间戳和 MAC 地址生成的 UUID 字符串。可以使用 `Sequelize.UUIDV1` 来获取该类型的默认值。
* UUIDV4：表示随机生成的 UUID 字符串。可以使用 `Sequelize.UUIDV4` 来获取该类型的默认值。

#### allowNull：是否可以为空

`allowNull` 是 Sequelize 中用于定义模型字段是否允许为空的属性选项。

当 `allowNull` 设置为 `true` 时，表示该字段允许为空。这意味着在创建记录或更新记录时，可以将该字段设置为空值（`null`）。如果设置为 false，表示该字段不能为空。

#### defaultValue：默认值

`defaultValue` 用于定义模型字段默认值的属性选项。

当创建记录时，如果没有提供该字段的值，则会使用 `defaultValue` 属性定义的默认值。

#### primaryKey：主键值

`primaryKey` 是用于指定模型字段作为主键的属性选项。

主键是数据库表中的一种特殊字段，它用于唯一标识表中的每一行记录。主键字段的值在整个表中必须是唯一的，并且不能为空。通过将 `primaryKey` 设置为 `true`，可以指示 Sequelize 将该字段设置为模型的主键。

#### autoIncrement：自增字段

`autoIncrement` 是一个用于指定模型字段是否为自增字段的属性选项。

自增字段是一种特殊类型的主键，它的值会在每次插入新记录时自动递增。通常用于为每个新记录分配唯一的标识符。自增字段的常见类型为整数（例如，INTEGER）。通过将 `autoIncrement` 设置为 `true`，可以指示 Sequelize 将该字段设置为自增字段。

使用自增字段可以方便地生成唯一的标识符，而无需显式指定每个新记录的值。数据库在插入新记录时会自动递增该字段的值。这对于需要快速添加新记录并确保主键唯一性的情况非常有用。

注意，`autoIncrement` 属性仅对整数类型的字段有效。

#### unique：是否唯一

`unique` 用于定义模型字段是否唯一的属性选项。

当将 `unique` 设置为 `true` 时，表示该字段的值必须在整个表中是唯一的。也就是说，在同一列中，每个记录都必须有一个唯一的值，不能重复。

#### validate：校验规则

`validate` 是用于定义模型字段验证规则的属性选项。

通过 `validate` 属性，可以定义一个包含验证规则的对象，用于验证模型字段的值是否符合指定的条件。`validate` 属性可以包含多个验证规则，每个规则可以是一个函数或一个对象。下面是一些常见的验证规则属性值：

* `notEmpty`：确保字段的值不为空。
* `len`：检查字段的长度是否在指定范围内。可以设置一个数组，如 `[min, max]`。
* `isEmail`：验证字段的值是否为有效的电子邮件地址。
* `isUrl`：验证字段的值是否为有效的 URL。
* `isAlpha`：验证字段的值是否只包含字母字符。
* `isAlphanumeric`：验证字段的值是否只包含字母和数字字符。
* `isNumeric`：验证字段的值是否为数字。
* `isInt`：验证字段的值是否为整数。
* `isFloat`：验证字段的值是否为浮点数。
* `isDate`：验证字段的值是否为有效的日期。
* `isAfter`：验证字段的值是否在指定日期之后。
* `isBefore`：验证字段的值是否在指定日期之前。
* `isIn`：验证字段的值是否在指定的数组中。

这只是一些常见的验证规则，Sequelize 还提供了更多的内置验证规则。此外，你还可以定义自定义的验证函数来进行复杂的验证逻辑。

```javascript
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 20],
      isAlphanumeric: true,
    },
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
});
```

#### comment：注释

`comment` 是用于为模型字段添加注释的属性选项。

注释是对字段的描述性文本，可以提供关于字段用途、含义或其他相关信息的补充说明。注释对于理解和维护数据库结构非常有帮助。

```javascript
const User = sequelize.define('User', {
  username: {
    type: Sequelize.STRING,
    comment: '用户的用户名', // 字段注释
  },
  email: {
    type: Sequelize.STRING,
    comment: '用户的电子邮件地址', // 字段注释
  },
});
```

#### field：字段重命名

field 是一个用于指定模型字段在数据库中的实际名称的属性选项。

默认情况下，Sequelize 会将模型定义中的字段名称直接映射到数据库表中对应的列名。但是，有时可能希望在数据库中使用不同的列名，这时可以使用 `field` 属性来指定实际的数据库列名。

```javascript
const User = sequelize.define('User', {
  firstName: {
    type: Sequelize.STRING,
    field: 'first_name', // 指定数据库对应的列名
  },
  lastName: {
    type: Sequelize.STRING,
    field: 'last_name', // 指定数据库对应的列名
  },
});
```

在上述示例中，`firstName` 字段的 `field` 属性设置为 `first_name`，`lastName` 字段的 `field` 属性设置为 `last_name`。这将导致在数据库表中创建名为 `first_name`和`last_name` 的列。

使用 `field` 属性可以非常灵活地控制模型字段与数据库列的映射关系。这在需要与遗留数据库或特定数据库命名约定交互的情况下非常有用。

注意，如果不指定 `field` 属性，Sequelize 将默认使用与模型字段名称相同的列名。

#### get 和 set：字段值计算

##### get

`get` 字段表示一个自定义的 `getter` 方法。它是一个通过访问模型实例属性来获取计算值的函数。

使用 `get` 字段，可以定义一个自定义的 `getter` 方法，该方法会在访问特定属性时被调用，以便根据需要对属性进行计算、处理或转换。

```javascript
const User = sequelize.define('User', {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  fullName: {
    type: Sequelize.VIRTUAL, // 虚拟属性
    get() {
      return `${this.firstName} ${this.lastName}`;
    },
  },
});

const user = User.build({
  firstName: 'Alice',
  lastName: 'Smith',
});

console.log(user.fullName); // 输出：Alice Smith
```

使用 `get` 字段可以方便地在访问模型属性时进行额外的计算或处理。它使得模型实例的属性具有更多的灵活性和复杂性。

##### set

`set` 字段表示一个自定义的 `setter` 方法。它允许你在设置属性值时执行一些自定义逻辑或转换。

使用 `set` 字段，可以定义一个自定义的 `setter` 方法，该方法会在设置特定属性的值时被调用，以便对该值进行处理、验证或转换。

```javascript
const User = sequelize.define('User', {
  fullName: {
    type: Sequelize.STRING,
    set(value) {
      const names = value.split(' ');
      this.setDataValue('firstName', names[0]);
      this.setDataValue('lastName', names[1]);
    },
  },
});

const user = User.build();
user.fullName = 'Alice Smith';

console.log(user.firstName); // 输出：Alice
console.log(user.lastName); // 输出：Smith
```

当给 `user.fullName` 赋值时，Sequelize 将自动调用定义的 `setter` 方法，并进行相应的属性设置。

使用 `set` 字段可以方便地在设置模型属性值时执行自定义的逻辑或转换操作。它使得模型属性的赋值具有更多的灵活性和复杂性。

#### references：模型关联

`references` 是一个模型定义中的选项，用于指定关联关系中引用的目标模型和目标属性。

当在 Sequelize 模型定义中使用 `references` 选项，它表示当前模型与另一个模型之间的关联关系，并指定了相关联的目标模型和目标属性。

```javascript
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
  },
});

const Post = sequelize.define('Post', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: User, // 引用的目标模型
      key: 'id', // 引用的目标属性
    },
  },
});
```

这里定义了两个模型：`User` 和 `Post`。在 `Post` 模型的定义中，使用了 `references` 选项来创建一个与 `User` 模型的关联关系。

`references` 选项包含两个属性：

* `model`：指定关联的目标模型，这里是 User`。`
* `key`：指定关联的目标属性，这里是 `id`。

这意味着 `Post` 模型中的 `userId` 属性将引用 `User` 模型中的 `id` 属性作为关联。这意味着 `userId` 和 `User` 模型的 `id` 属性具有相同的值。

通过使用 `references` 选项，Sequelize 可以根据关联关系设置合适的数据库约束，并帮助你在查询中轻松处理模型之间的关联。

#### onDelete：删除关联

`onDelete` 是一个定义关联关系时可以设置的选项之一。它用于指定当关联模型的记录被删除时要执行的操作。

使用 `onDelete` 选项，可以定义在删除关联模型的记录时应该执行的操作，例如级联删除、设置为 `null` 或什么都不做等。

以下是一些常用的 `onDelete` 选项值及其含义：

* `CASCADE`：级联删除。当关联模型的记录被删除时，与之关联的记录也将被删除。
* `SET NULL`：设置为 null。当关联模型的记录被删除时，与之关联的记录的外键值将被设置为 null。
* `SET DEFAULT`：设置为默认值。当关联模型的记录被删除时，与之关联的记录的外键值将被设置为默认值。
* `RESTRICT`：限制。当关联模型的记录被删除时，如果还有与之关联的记录存在，则会阻止删除操作。

```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  }
});

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE' // 当关联的 User 记录被删除时，与之关联的 Post 记录也将被删除
  }
});
```

这里定义了一个 `User` 模型和一个 `Post` 模型。在 `Post` 模型的定义中，我们设置了与 `User` 模型的关联，并在 `userId` 属性上使用了 `onDelete: 'CASCADE'` 选项。这意味着当与之关联的 `User` 记录被删除时，与之关联的 `Post` 记录也将被级联删除。

#### onUpdate：更新关联

`onUpdate` 是一个定义关联关系时可以设置的选项之一。它用于指定当关联模型的记录被更新时要执行的操作。

使用 `onUpdate` 选项，可以定义在更新关联模型的记录时应该执行的操作，例如级联更新或什么都不做等。

以下是一些常用的 `onUpdate` 选项值及其含义：

* `CASCADE`：级联更新。当关联模型的记录被更新时，与之关联的记录也将相应地进行更新。
* `SET NULL`：设置为 null。当关联模型的记录被更新时，与之关联的记录的外键值将被设置为 null。
* `SET DEFAULT`：设置为默认值。当关联模型的记录被更新时，与之关联的记录的外键值将被设置为默认值。
* `RESTRICT`：限制。当关联模型的记录被更新时，如果有其他关联记录存在，则会阻止更新操作。

```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  }
});

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    },
    onUpdate: 'CASCADE' // 当关联的 User 记录被更新时，与之关联的 Post 记录也将被相应地更新
  }
});
```

这里定义了一个 `User` 模型和一个 `Post` 模型。在 `Post` 模型的定义中，我们设置了与 `User` 模型的关联，并在 `userId` 属性上使用了 `onUpdate: 'CASCADE'` 选项。这意味着当与之关联的 `User` 记录被更新时，与之关联的 `Post` 记录也将相应地进行级联更新。

## 模型继承

模型继承是一种将一个模型继承自另一个模型的机制。这使得你可以从一个已有的模型中派生出新的模型，并继承它的属性、方法和关联关系，从而实现代码重用和模型的层次结构组织。

模型继承通过使用 `sequelize.define()` 方法的 `options` 参数来实现。在定义模型时，可以指定 `options` 参数中的 `extend` 属性，来指定该模型继承自哪个父模型。被继承的父模型称为基础（或父）模型，而继承的新模型称为派生（或子）模型。

下面来看看如何在 Sequelize 中进行模型继承：

```javascript
const { Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('database', 'username', 'password');

// 定义基础模型
const BaseModel = sequelize.define('base', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // 其他属性...
});

// 定义派生模型，并继承基础模型
const DerivedModel = sequelize.define('derived', {
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // 其他属性...
}, {
  extend: BaseModel,
});

// 创建派生模型的实例
DerivedModel.create({ name: 'John', age: 25 })
  .then((instance) => {
    console.log(instance.toJSON());
  })
  .catch(console.error);
```

这里首先定义了一个基础模型 `BaseModel`，它有一个名为 `name` 的属性。然后，定义了派生模型 `DerivedModel`，它继承自基础模型，并新增了一个名为 `age` 的属性。最后，我们使用派生模型的 `create()` 方法创建一个新的实例，并输出其序列化后的 JSON 数据。

通过模型继承，可以在派生模型中重用和扩展基础模型的属性、方法和关联关系，从而简化代码的编写和维护。这对于构建具有层次结构的数据模型非常有用，例如用户、管理员和超级管理员之间的继承关系。

## 修改模型

在 Sequelize 中，修改、删除已有字段或新增字段的过程如下：

1. 在模型定义中进行相应的更改。
2. 使用 Sequelize 提供的迁移工具执行数据库迁移操作。

过程如下：

1. 修改已有字段的数据类型和属性：

```javascript
// 修改已有字段的数据类型和属性
await sequelize.queryInterface.changeColumn('User', 'age', {
  type: Sequelize.STRING,
  allowNull: true,
});
```

2. 删除已有字段：

```javascript
// 删除已有字段
await sequelize.queryInterface.removeColumn('User', 'age');
```

3. 新增字段：

```javascript
 {
// 新增字段
await sequelize.queryInterface.addColumn('User', 'gender', {
  type: Sequelize.STRING,
  allowNull: true,
});
```

这里用 Sequelize 提供的 `queryInterface` 对象来执行数据库迁移操作。该对象提供了一系列方法来修改表结构。

* 对于修改已有字段，可以使用 `changeColumn` 方法指定要更改的模型名称、字段名称和新的属性。
* 对于删除已有字段，可以使用 `removeColumn` 方法指定要删除的模型名称和字段名称。
* 对于新增字段，我们可以使用 `addColumn` 方法指定要新增字段的模型名称、字段名称和属性。

在 Sequelize 中，修改模型定义并执行相应的迁移操作后，默认情况下数据库表不会自动同步更改。你需要显式地调用 `sequelize.sync` 方法来同步模型和数据库表。以下是一个在执行迁移操作后手动调用 `sequelize.sync` 方法的示例代码：

```javascript
// 执行迁移操作...
// ...
// 手动同步模型和数据库表
await sequelize.sync();
```

这里使用 `await sequelize.sync()` 方法手动同步模型和数据库表。这将更新数据库表结构以匹配模型定义的更改。

注意，`sequelize.sync()` 方法会根据模型定义生成创建、修改或删除表的 SQL 命令，然后将其应用于数据库。因此，请确保在生产环境中谨慎使用该方法，并提前备份重要的数据。

如果使用 Sequelize-CLI 或其他迁移工具来管理数据库迁移，它们通常会自动处理模型与数据库表的同步操作，你不需要手动调用 `sequelize.sync()` 方法。但如果你手动修改了模型定义或直接使用 `queryInterface` 修改数据库表结构，则需要手动同步模型和数据库表。

## 删除模型

要删除 Sequelize 中的模型，可以使用 `sequelize.drop` 方法。

以下是一个示例代码来删除一个名为 `User` 的模型：

```javascript
// 删除模型
await User.drop();
```

注意，删除模型将会永久删除数据库表，包括其中的数据。在执行模型删除操作之前，请确保备份重要的数据。请谨慎操作删除模型，确保你的操作不会导致数据丢失或不可逆的更改。

在异步函数中执行删除操作，并在完成后输出相应的信息。最后，记得关闭 Sequelize 连接，以避免资源泄漏。

# 模型查询

先来看看查询是一些通用查询参数。

## 通用参数

#### where：查询条件

使用 `where` 方法可以添加查询条件，它可以用于查询语句中的各种不同部分，如 `findOne` 和 `findAll` 等。通过 `where` 方法可以根据指定的条件过滤数据库中的记录。

Op 对象是 Sequelize 中用于定义各种操作符的对象。它提供了很多常用的操作符，可以在查询条件中使用。以下是一些常见的 Op 属性及其对应的操作符：

* `Op.eq`：等于
* `Op.ne`：不等于
* `Op.gt`：大于
* `Op.gte`：大于等于
* `Op.lt`：小于
* `Op.lte`：小于等于
* `Op.like`：模糊匹配
* `Op.notLike`：不匹配
* `Op.iLike`：忽略大小写的模糊匹配
* `Op.notILike`：忽略大小写的不匹配
* `Op.in`：在给定数组中的值
* `Op.notIn`：不在给定数组中的值
* `Op.between`：在给定范围内的值
* `Op.notBetween`：不在给定范围内的值

##### 等于

```javascript
model.findAll({
  where: {
    age: 18
  }
});
```

上述代码会查找 `age` 等于 18 的所有记录。

##### 不等于

```javascript
model.findAll({
  where: {
    age: {[Op.ne]: 18}
  }
});
```

上述代码会查找 `age` 不等于 18 的所有记录。

##### 大于

```javascript
model.findAll({
  where: {
    age: {[Op.gt]: 18}
  }
});
```

上述代码会查找 `age` 大于 18 的所有记录。

##### 小于

```javascript
model.findAll({
  where: {
    age: {[Op.lt]: 18}
  }
});
```

上述代码会查找 `age` 小于 18 的所有记录。

##### 大于等于

```javascript
model.findAll({
  where: {
    age: {[Op.gte]: 18}
  }
});
```

上述代码会查找 `age` 大于等于 18 的所有记录。

##### 小于等于

```javascript
model.findAll({
  where: {
    age: {[Op.lte]: 18}
  }
});
```

上述代码会查找 `age` 小于等于 18 的所有记录。

##### 模糊匹配

```javascript
model.findAll({
  where: {
    name: {
      [Op.like]: '%John%'
    }
  }
});
```

上述代码会查找 `name` 字段中包含 "John" 的所有记录。

也可以使用 `$like` 来查询，这是 sequelize 的旧语法，建议使用新语法 `[Op.like]` 来查询：

```javascript
model.findAll({
  where: {
    name: {
      $like: '%John%'
    }
  }
});
```

##### 范围

```javascript
model.findAll({
  where: {
    age: {[Op.between]: [18, 30]}
  }
});
```

上述代码会查找 `age` 在 18 到 30 之间的所有记录。

##### 子查询

可以使用 `[Op.or]` 操作符来实现查询一个字段等于 `a` 或 `b` 的操作。

```javascript
const { Op } = require('sequelize');

const users = await User.findAll({
  where: {
    [Op.or]: [
      { name: 'a' },
      { name: 'b' },
    ],
  },
});
```

这里使用 `findAll` 方法查找所有名字等于 'a' 或 'b' 的用户。其中，`[Op.or] `表示 OR 连接操作符，将两个条件拼接成 OR 条件。

注意，在实际使用时，如果需要查询多个可能值，可以使用`[Op.in]`操作符，例如：

```javascript
const users = await User.findAll({
  where: {
    name: {
      [Op.in]: ['a', 'b'],
    },
  },
});
```

上述代码将会查询所有名字等于 'a' 或 'b' 的用户。

#### include：包含关联模型

在 Sequelize 中，可以使用关联来定义模型之间的关系，例如一对一、一对多或多对多关系。当查询模型时，如果希望返回与该模型关联的其他模型的属性，就需要使用 `include` 选项来包含关联模型。可以根据需要轻松地从其他模型中获取相关数据，而无需单独进行额外的查询操作。

```javascript
User.findAll({
  include: {
    model: Post,
    attributes: ['title', 'content']
  }
})
  .then((users) => {
    // 处理查询结果
    users.forEach((user) => {
      console.log('用户名:', user.name);
      console.log('用户发布的文章:');
      user.Posts.forEach((post) => {
        console.log('标题:', post.title);
        console.log('内容:', post.content);
      });
    });
  })
  .catch((error) => {
    // 处理查询错误
  });
```

这里使用 User 模型进行查询，通过 `include` 选项包含了关联的 `Post` 模型。然后，在 `.then` 回调函数中处理查询结果。每个用户对象都包含了他们的相关文章数据，可以通过访问 `user.Posts` 属性来获取关联的文章数据。

当在主模型上执行查询后，包含关联模型的查询实际上是在主模型查询的基础上进行的。

首先，使用主模型进行查询，获取与查询条件匹配的主模型数据。然后，在查询结果中包含的每个主模型实例上，Sequelize 将自动执行额外的查询来获取与之关联的其他模型的数据。

这种查询方式称为**延迟加载**或**延迟关联**。它的优点是只有在需要访问关联模型数据时才执行额外的查询，避免了不必要的查询开销。

在上面的示例中，当调用 `User.findAll()` 查询用户时，Sequelize 会从数据库获取与查询条件匹配的用户数据。然后，当访问 `user.Posts` 属性时，Sequelize 会自动执行另一个查询来获取该用户关联的文章数据。

在查询时包含多个关联模型，可以通过 Sequelize 的 `include` 选项的不同方式来实现。下面有两种常用的方法：

1. **使用数组形式包含多个关联模型**：

```javascript
User.findAll({
  include: [
    { model: Profile },
    { model: Post }
  ]
})
  .then((users) => {
    // 处理查询结果
    users.forEach((user) => {
      console.log('用户名:', user.name);
      console.log('用户配置:', user.Profile);
      console.log('用户文章:', user.Posts);
    });
  })
  .catch((error) => {
    // 处理查询错误
  });
```

在上述代码中，将要包含的关联模型作为对象放入数组中，并将该数组作为 `include` 选项的值。这样，在查询结果中就会包含多个关联模型的数据。

2. **嵌套方式包含多个关联模型**：

```javascript
User.findAll({
  include: [
    { 
      model: Profile,
      include: [Category]  // 在 Profile 模型中嵌套包含 Category 模型
    },
    { model: Post }
  ]
})
  .then((users) => {
    // 处理查询结果
    users.forEach((user) => {
      console.log('用户名:', user.name);
      console.log('用户配置:', user.Profile);
      console.log('用户文章:', user.Posts);
      console.log('用户配置的类别:', user.Profile.Category);
    });
  })
  .catch((error) => {
    // 处理查询错误
  });
```

这里使用嵌套的方式，在其中一个关联模型的 `include` 选项中，再嵌套包含另一个关联模型。这样可以实现更深层次的关联查询。

通过以上方式，可以在查询时包含多个关联模型，并获取它们的数据。根据需求和模型之间的关系，可以灵活地组合和嵌套使用 `include` 选项来包含多个关联模型。

> 注意：只有在模型定义中定义了关联关系，才能在查询时包含关联模型。

#### attributes：返回字段

可以使用 `attributes` 选项指定要返回的字段。示例：`attributes: ['id', 'name']`。它用于控制查询结果中包含哪些属性或排除哪些属性，可以接受多种形式的参数，以控制返回的属性。

以下是几种常见的 `attributes` 选项的用法：

* **字符串数组**：可以传入一个字符串数组，表示要返回的属性名。示例：`attributes: ['name', 'age']`，表示查询结果将仅包含 'name' 和 'age' 两个字段。
* **嵌套对象**：可以传入一个嵌套对象，用于更复杂的字段控制。示例：`attributes: { include: ['name'], exclude: ['age'] }`，表示查询结果将包含 `name` 字段，并排除 `age` 字段。
* **聚合函数**：可以使用聚合函数对属性进行计算，并将计算结果命名为新的属性。示例：`attributes: [[sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity']]`，表示查询结果中将返回一个计算总和的聚合函数，并将计算结果命名为`totalQuantity`。

注意事项：

* 如果不指定 `attributes` 选项，默认情况下会返回所有模型的属性；指定了 `attributes` 选项后，只会返回指定的属性。
* 使用 `attributes` 选项时，如果要返回关联模型的属性，需要在关联模型上设置 `include` 选项。

#### order：排序规则

可以使用 `order` 选项来指定返回结果的排序规则。示例：`order: [['createdAt', 'DESC']]`，它表示按照 `createdAt` 字段进行降序排列。

在 Sequelize 中，可以通过 `order` 选项来指定查询结果的排序规则。排序规则由一个二维数组表示，每个子数组包含两个元素：**排序字段**和**排序方式**。排序字段可以是模型的属性名或关联模型的属性名。排序方式可以是 `'ASC'`（升序）或 `'DESC'`（降序）。

以下是`order` 选项常见的用法：

* **单字段排序**：可以只指定一个排序字段和排序方式。示例：`order: [['fieldName', 'ASC']]`。
* **多字段排序**：可以指定多个排序字段和排序方式，按照指定的顺序依次排序。示例：`order: [['field1', 'ASC'], ['field2', 'DESC']]`。
* **关联模型排序**：可以使用关联模型的属性进行排序。示例：`order: [['RelatedModel', 'fieldName', 'ASC']]`。

注意事项：

* 排序字段必须是模型或关联模型的属性名。
* 排序方式应为 `'ASC'` 或 `'DESC'`。
* 在查询语句中使用多个排序条件时，将按照指定的顺序依次应用这些条件。

```javascript
Model.findOne({
  where: {
    // 查询条件
    status: 'active'
  },
  order: [['createdAt', 'DESC']]
})
  .then((records) => {
    // 处理查询结果
  })
  .catch((error) => {
    // 处理查询错误
  })

```

这里使用了 `order` 选项，通过 `[['createdAt', 'DESC']]` 指定了按照 `createdAt` 字段进行降序排列。

#### limit：查询结果的数量

用于限制查询结果返回的记录数量，常用于分页查询。

```javascript
Model.findAll({
  limit: 10  // 返回最多 10 条记录
})
  .then((results) => {
    // 处理查询结果
  })
  .catch((error) => {
    // 处理查询错误
  });
```

#### offset：查询结果的偏移量

用于设置查询结果的偏移量，从指定位置开始返回结果，常用于分页查询。这个偏移量是基于索引的，而索引是从零开始计数的。

```javascript
Model.findAll({
  offset: 5  // 忽略前 5 条记录
})
  .then((results) => {
    // 处理查询结果
  })
  .catch((error) => {
    // 处理查询错误
  });

```

#### group：结果分组

用于对结果进行分组：按照指定的字段值进行分类归纳，将具有相同字段值的记录放在一组中。

```javascript
Model.findAll({
  attributes: ['age'],
  group: ['age']
})
  .then((results) => {
    // 处理查询结果
    results.forEach((group) => {
      console.log('分组:');
      group.forEach((record) => {
        console.log('记录:', record);
      });
    });
  })
  .catch((error) => {
    // 处理查询错误
  });
```

这里使用 `group` 选项对 `age` 字段进行分组。查询结果 `results` 是一个数组，其中每个元素代表一个分组。对于每个分组，可以遍历内层数组 group，其中的每个元素代表该分组中的一条记录。

#### distinct：结果去重

当设置 `distinct: true` 时，查询结果将会返回去重后的记录。这在某些情况下非常有用，例如获取一个字段的唯一值列表或者按照某个字段进行分组统计时。

这里使用 `distinct: true` 设置查询结果为去重模式，并指定了要查询的字段为 `name`。查询结果将只包含去重后的姓名列表。

例如，假设有一个名为 `User` 的模型，并且希望获取所有不重复的用户名：

```javascript
const users = await User.findAll({
  attributes: ['name'],
  distinct: true
});
```

这里通过设置 `distinct: true` 来确保只返回不重复的用户名。查询结果将只包含唯一的、不重复的用户名。

注意，`distinct` 选项必须与指定的查询字段一起使用，确保只对指定的字段进行去重操作。

## findOne：查询第一条

查询符合条件的第一条记录。

```javascript
Model.findOne({
  where: {
    // 查询条件
    id: 1
  }
})
  .then((record) => {
    if (record) {
      console.log('查询到的记录:', record.get({ plain: true }));
    } else {
      console.log('未找到符合条件的记录');
    }
  })
  .catch((error) => {
    // 处理查询错误
  });
```

这个方法的返回值是一个 Sequelize Model 对象，其中包含与记录相关联的属性、方法和关系。它具有以下特性：

* **属性访问**：可以通过属性名直接访问记录的字段值，例如 `record.fieldName`。
* **数据获取**：可以使用 `.get()` 方法获取包含所有字段的对象形式的记录数据，例如 `record.get()`，其用法如下。
  * `record.get()`：返回一个包含所有字段的对象，其中字段名作为键，字段值作为值。这个对象是 Sequelize 模型实例，包含与记录相关联的属性和方法。
  * `record.get({ plain: true })`：返回一个纯对象，只包含记录的原始字段和值，不包含与 Sequelize 相关的属性和方法。
  * 获取指定字段的值：可以传递一个或多个字段名作为参数，获取特定字段的值。示例：`record.get('fieldName')` 或 `record.get('field1', 'field2')`。
  * 排除指定字段：可以使用 `{ exclude: ['fieldName'] }` 选项来排除指定的字段，获取除这些字段外的其他字段。示例：`record.get({ exclude: ['fieldName'] })`。
  * 只获取指定字段：可以使用 `{ attributes: ['fieldName'] }` 选项来只获取指定的字段。示例：`record.get({ attributes: ['fieldName'] })`。

```javascript
Model.findOne({
  where: {
    // 查询条件
    id: 1
  }
})
  .then((record) => {
    if (record) {
      const fieldValue = record.get('fieldName');
      console.log('字段值:', fieldValue);
      
      const excludedData = record.get({ exclude: ['field1', 'field2'] });
      console.log('排除字段后的数据:', excludedData);
      
      const selectedData = record.get({ attributes: ['field1', 'field2'] });
      console.log('只包含指定字段的数据:', selectedData);
    } else {
      console.log('未找到符合条件的记录');
    }
  })
  .catch((error) => {
    // 处理查询错误
  });
```

注意，`Model.findOne` 方法只返回满足查询条件的第一条记录。如果没有符合条件的记录，则返回 `null`。

另外，`distinct: true` 在某些数据库管理系统中可能会导致性能下降，因为它需要进行更多的计算来实现去重。所以在使用 `distinct: true` 时，要谨慎考虑其对性能的影响。

## findAll：查询全部

`sequelize.findAll()` 用于从数据库中检索所有匹配给定条件的记录。它的语法如下：

```javascript
Model.findAll({
  attributes: [], // 要选择的属性列表，默认为所有属性
  where: {}, // 过滤条件
  include: [], // 关联模型
  order: [], // 排序规则
  limit: 0, // 返回的最大记录数，默认为0（返回所有记录）
  offset: 0, // 结果集的起始偏移量，默认为0
});
```

参数说明：

* `attributes`：指定要选择的属性列表，如果为空，则返回所有属性。
* `where`：指定过滤条件，可以使用各种条件运算符（如等于、不等于、大于、小于等）来筛选记录。
* `include`：指定要关联的其他模型，可以进行关联查询。
* `order`：指定结果集的排序规则。
* `limit`：指定要返回的最大记录数，默认为0，表示返回所有符合条件的记录。
* `offset`：指定结果集的起始偏移量，默认为0。

这个方法将返回一个Promise，当查询成功时，Promise将解析为包含所有符合条件的记录的数组。以下是一个示例：

```javascript
Model.findAll({
  where: {
    // 查询条件
    status: 'active'
  }
})
  .then((records) => {
    if (records.length > 0) {
      console.log('查询到的记录数:', records.length);
      
      records.forEach((record) => {
        const data = record.get();
        console.log('记录数据:', data);
      });
    } else {
      console.log('未找到符合条件的记录');
    }
  })
  .catch((error) => {
    // 处理查询错误
  });
```

注意，如果没有查询到符合条件的记录，返回的数组将为空。

## findByPk：根据主键值查询

根据主键值查询记录，它的语法如下：

```javascript
Model.findByPk(id, options);
```

参数说明：

* `id`：要查询的记录的主键值。
* `options`：可选参数，用于指定进一步的配置，比如关联模型等。

下面来看一个例子，通过主键值来获取特定的用户记录：

```javascript
const user = await User.findByPk(1);
console.log(user);
```

上述代码将查询主键值为 `1` 的用户记录，并将结果保存在 `user` 变量中。如果找到匹配的记录，则 `user` 将是一个包含该记录的对象。否则，`user` 将是 `null`。

如果要通过主键值获取多个记录，可以传入一个数组作为 id 参数，如：

```javascript
const users = await User.findByPk([1, 2, 3]);
console.log(users);
```

上述代码将查询主键值为 1、2 和 3 的用户记录，并将结果保存在 `users` 变量中，它将是一个包含这些记录的数组。

`findByPk` 也可以与其他查询配置选项一起使用，例如关联模型、选择属性等。可以在 `options` 参数中指定这些额外的配置选项。

注意：`findByPk` 方法返回一个 Promise，在查询成功时解析为匹配的记录（或记录数组），在查询失败时拒绝为错误对象。因此，需要使用 `await` 或 `.then()` 来处理查询结果或捕获错误。

在 Sequelize 中，主键值是指用于唯一标识数据库表中每个记录的列或属性。主键值在表中具有唯一性，没有重复的值，且不能为空。在 Sequelize 模型定义中，可以通过 primaryKey: true 来将某个属性指定为主键。例如：

```javascript
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING
});
```

在上述例子中，`id` 属性被指定为主键。它的类型为整数（INTEGER），并且设置了 `primaryKey: true` 表示该属性是主键。此外，还可以使用 `autoIncrement: true` 来指定该主键自动增长，以便在插入新记录时自动生成唯一的主键值。

当使用 `findByPk`、`update`、`destroy` 等方法时，通常会使用主键值来准确定位要操作的记录。通过提供正确的主键值，Sequelize 可以根据主键来查询、更新或删除相应的记录。

## findOrCreate：查询或创建

`findOrCreate` 用于根据指定条件查找数据库中的记录，如果找到匹配的记录，则返回该记录；如果找不到匹配的记录，则创建一个新的记录并返回。它的语法如下：

```javascript
Model.findOrCreate({
  where: { ... },
  defaults: { ... },
  ...
});
```

参数说明：

* `where`：包含查找条件的对象，用于指定要匹配的属性和值。
* `defaults`：包含要创建新记录时的默认值的对象。
* `...`：其他可选参数，用于进一步配置查询。

使用 `findOrCreate` 方法时，Sequelize 首先根据 `where` 条件尝试在数据库中查找符合条件的记录。如果找到匹配的记录，则返回该记录作为结果。

如果没有找到匹配的记录，则使用 `defaults` 指定的默认值创建一个新的记录，并返回该新记录作为结果。默认值将应用于新创建的记录的属性。

例如，假设有一个名为 `User` 的模型表示用户表，其中 `email` 是唯一的：

```javascript
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true
  }
});
```

现在想根据邮箱查找用户记录，如果找到则返回该记录，如果找不到则创建一个新用户记录。可以使用 `findOrCreate` 方法：

```javascript
const [user, created] = await User.findOrCreate({
  where: { email: 'example@example.com' },
  defaults: { name: 'John Doe' }
});

console.log(user); // 匹配的记录或新创建的记录
console.log(created); // 表示是否新创建了记录的布尔值
```

上述代码将根据指定的邮箱查找用户记录，如果找到匹配的记录，则返回该记录。如果没有找到匹配的记录，则创建一个新的记录，并返回新创建的记录。

`findOrCreate` 方法返回一个包含两个元素的数组：第一个元素是匹配的记录（已存在或新创建），第二个元素是一个布尔值，表示是否新创建了记录。

如果有多个符合条件的记录，`findOrCreate` 方法仅返回匹配的第一个记录。它不会返回所有符合条件的记录。

## findAndCountAll：查询记录和数量

`findAndCountAll` 用于查找满足指定条件的所有记录，并返回满足条件的记录数组和记录总数。它的语法如下：

```javascript
Model.findAndCountAll({
  where: { ... },
  include: [ ... ],
  offset: ...,
  limit: ...,
  order: [...],
  ...
});
```

参数说明：

* `where`：包含查找条件的对象，用于指定要匹配的属性和值。
* `include`：指定关联模型，用于在查询中包含关联的数据。
* `offset`：指定查询的偏移量，用于分页。
* `limit`：指定查询的限制数量，用于分页。
* `order`：指定查询结果的排序顺序。
* `...`：其他可选参数，用于进一步配置查询。

使用 `findAndCountAll` 方法时，Sequelize 将根据指定的条件在数据库中查找符合条件的所有记录，并同时返回满足条件的记录数组和记录总数。

```javascript
const { count, rows } = await User.findAndCountAll({
  where: { age: 25 },
  include: [Post],
  offset: 0,
  limit: 10,
  order: [['createdAt', 'DESC']]
});

console.log(count); // 符合条件的记录总数
console.log(rows); // 符合条件的记录数组
```

在上述代码中，`findAndCountAll` 方法将根据年龄为 25 的条件在数据库中查找用户记录，并返回满足条件的记录总数和记录数组。`include` 参数用于指定要关联的 `Post` 模型。

`findAndCountAll` 方法返回的结果是一个包含 `count` 和 `rows` 属性的对象。`count` 表示符合条件的记录总数，`rows` 表示符合条件的记录数组。

使用 `findAndCountAll` 方法可以方便地获取满足条件的记录总数以及相应的记录数组，用于实现分页和其他结果统计的需求。

## count：查询数量

可以使用 `count` 方法来获取满足指定条件的记录数。它的语法如下：

```javascript
Model.count({
  where: { ... },
  ...
});
```

参数说明：

* `where`：包含查找条件的对象，用于指定要匹配的属性和值。
* `...`：其他可选参数，用于进一步配置查询。

使用 `count` 方法时，Sequelize 将根据指定的条件在数据库中计算符合条件的记录数，并返回该记录数。

```javascript
const count = await User.count({
  where: { age: 25 }
});

console.log(count); // 符合条件的记录数
```

在上述代码中，`count` 方法将根据年龄为 25 的条件在数据库中计算符合条件的用户记录数，并将其返回。该方法返回的结果将是一个表示符合条件的记录数的整数值。

通过使用 `count` 方法，可以方便地获取满足条件的记录数，用于进行结果统计、分页计算或其他相关处理。

## min, max, sum：查询最值

可以使用 `min`、`max` 和 `sum` 方法来进行最小值、最大值和求和计算。

这些方法可以通过调用模型的静态方法来实现，具体语法如下：

1. `min` 方法用于计算指定属性列的最小值：

```javascript
Model.min('column', {
  where: { ... },
  ...
});
```

2. `max` 方法用于计算指定属性列的最大值：

```javascript
Model.max('column', {
  where: { ... },
  ...
});
```

3. `sum` 方法用于计算指定属性列的总和：

```javascript
Model.sum('column', {
  where: { ... },
  ...
});
```

参数说明：

* `'column'`：要进行计算的属性列的名称。
* `where`：包含查找条件的对象，用于指定要匹配的属性和值。
* `...`：其他可选参数，用于进一步配置查询。

```javascript
const minValue = await Model.min('column', {
  where: { ... }
});

const maxValue = await Model.max('column', {
  where: { ... }
});

const sumValue = await Model.sum('column', {
  where: { ... }
});

console.log(minValue); // 最小值
console.log(maxValue); // 最大值
console.log(sumValue); // 总和
```

注意，这些方法将返回一个 Promise 对象，需要使用 `await` 或 `.then()` 来获取计算结果。

## create：创建数据

`create()` 方法用于在数据库中创建一个新的记录。它是 Sequelize 模型的一个实例方法，可以通过模型对象调用。

```javascript
const newUser = await User.create({
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 25,
});
```

使用 `User.create()` 方法创建一个名为 `User` 的新记录。通过传递一个包含属性和值的对象参数，指定要创建的记录的字段值。调用 `create()`方法会将新记录插入到与模型关联的数据库表中，并返回一个表示新记录的模型实例。

注意，`create()` 方法返回的是一个 Promise 对象，因此可以使用 `await` 关键字来等待创建操作的结果。如果创建成功，将返回包含新记录数据的模型实例；如果创建失败，将抛出一个异常。

`create()` 方法可以用于创建单个记录，也可以用于批量创建多条记录。如果想要批量创建多条记录，可以将一个包含多个对象的数组传递给 `create()` 方法。

```javascript
const newUsers = await User.create([
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 25,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 30,
  },
]);
```

## bulkCreate：批量创建数据

要批量添加数据，可以使用 `Model.bulkCreate()` 方法。`bulkCreate()` 方法接受一个数组作为参数，每个数组元素都表示要创建的记录。

```javascript
const newUsers = await User.bulkCreate([
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 25,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    age: 30,
  },
  // 可以继续添加更多对象...
]);
```

这里定义了一个 `users` 数组，其中包含要添加到数据库的多个对象，每个对象表示一条记录。然后，调用 `User.bulkCreate()` 方法，并传递 `users` 数组作为参数，以批量添加这些记录。

`bulkCreate()` 方法将会将数组中的每个对象插入到与模型关联的数据库表中，并返回一个包含新记录的模型实例数组。可以根据实际需求在 `users` 数组中添加任意数量的对象，以批量添加相应数量的记录。

`bulkCreate()` 和 `create()` 方法都可以用于创建多条数据，但它们之间有一些区别：

1. 性能差异：
   * `create()` 方法在循环中逐个创建记录，并执行多个数据库查询操作。这意味着对于大量数据的批量创建，性能可能较低。
   * `bulkCreate()` 方法会将所有记录作为一个事务一次性插入数据库，减少了数据库查询操作的次数，因此在处理大量数据时可以更高效。
2. 错误处理：
   * `create()` 方法是可回滚的，即如果在循环中创建多个记录时发生错误，可以选择回滚已创建的记录。
   * `bulkCreate()` 方法默认情况下是不可回滚的，即如果在批量插入过程中发生错误，已插入的记录将被保留。但你可以通过设置 `individualHooks: true` 选项来启用回滚功能。
3. 返回值：
   * `create()` 方法在成功创建每条记录后，返回一个表示该记录的模型实例。
   * `bulkCreate()` 方法在成功插入所有记录后，返回一个包含所有新记录的模型实例数组。

综上所述，对于需要创建大量数据的情况，推荐使用 `bulkCreate()` 方法，以获得更好的性能。但在某些情况下，例如需要在每次创建记录时进行自定义操作或错误处理时，可以选择使用 `create()` 方法。

## update：更新数据

可以使用 `update` 方法来更新数据库中的记录。它的语法如下：

```javascript
Model.update(values, {
  where: { ... },
  ...
});
```

参数说明：

* `values`：一个包含要更新的属性和值的对象。
* `where`：一个包含更新条件的对象，用于指定要匹配的属性和值。
* `...`：其他可选参数，用于进一步配置更新。

使用 `update` 方法时，Sequelize 将根据指定的条件在数据库中查找符合条件的记录，并将相应的属性更新为指定的新值。

```javascript
const result = await User.update(
  { age: 30, status: 'active' },
  {
    where: { id: 1 }
  }
);

console.log(result); // 更新结果
```

在上述代码中，`update` 方法将会将 `id` 属性为 1 的用户记录的 `age` 和 `status` 属性更新为新的值。

注意，`update` 方法返回一个表示更新结果的数组。该数组的第一个元素表示更新的行数，第二个元素表示影响的行数。

```javascript
const updatedRows = result[0];
const affectedRows = result[1];

console.log(updatedRows); // 更新的行数
console.log(affectedRows); // 影响的行数

```

通过使用 `update` 方法，可以方便地更新满足条件的记录，并可以灵活配置要更新的属性和值。

注意，`update` 方法只能更新单条记录。如果想要更新多条数据，可以借助 `Promise.all` 来实现：

```javascript
// 查找需要更新的数据
const usersToUpdate = await User.findAll({ where: { status: 'active' } });

// 更新数据
await Promise.all(usersToUpdate.map(user => {
  return user.update(
    { status: 'inactive' } // 更新的字段和值
  );
}));
```

## destroy：删除数据

在 Sequelize 中，可以使用 `destroy` 方法来删除数据库中的记录。它的语法如下：

```javascript
Model.destroy({
  where: { ... },
  ...
});
```

参数说明：

* `where`：包含删除条件的对象，用于指定要匹配的属性和值。
* `...`：其他可选参数，用于进一步配置删除操作。

使用 `destroy` 方法时，Sequelize 将根据指定的条件在数据库中查找符合条件的记录，并将其从数据库中删除。

```javascript
const result = await User.destroy({
  where: { id: 1 }
});

console.log(result); // 删除结果
```

在上述代码中，`destroy` 方法将会删除数据库中 `id` 属性为 1 的用户记录。该方法返回一个表示删除结果的整数值。该值表示成功删除的记录数。

`destroy` 方法可以删除满足多个条件的记录，从而批量删除数据库中的多个值。

```javascript
const result = await User.destroy({
  where: {
    age: { [Op.gt]: 30 },  // 年龄大于30
    status: 'inactive'     // 状态为inactive
  }
});

console.log(result); // 删除结果
```

上述代码将会删除数据库中年龄大于30且状态为`inactive`的用户记录。

# 模型聚合

模型聚合指的是使用 Sequelize 模型来执行数据库查询，并对查询结果进行聚合操作。通过使用 Sequelize 模型的聚合功能，你可以灵活地执行各种统计和计算操作，并从数据库中获取所需的聚合结果。

模型聚合通常用于在查询中应用聚合函数，以获取关于数据集的汇总信息。聚合函数可以是内置的数据库函数，也可以是自定义的函数。常见的聚合函数包括 `SUM`、`COUNT`、`AVG`、`MAX`、`MIN` 等。

假设有一个 `Product` 模型，它表示产品表。每个产品都有一个 `price` 字段，表示产品的价格。现在，想计算所有产品的平均价格。可以使用 Sequelize 的模型聚合功能来实现：

```javascript
const { fn, col } = require('sequelize');

const result = await Product.findOne({
  attributes: [
    [fn('AVG', col('price')), 'avgPrice']
  ]
});
```

这里使用 `Product.findOne` 查询单个产品，并使用 `attributes` 参数指定要选择的属性列。我们使用 `sequelize.fn` 和 `sequelize.col` 创建了一个新的属性列，将其命名为 `avgPrice`，并应用了 `AVG` 聚合函数来计算价格的平均值。查询结果将包含产品价格的平均值，以及对应的属性名称。

注意，通过使用 `sequelize.fn` 和 `sequelize.col`，可以在查询结果中创建一个虚拟的属性列，用于存储聚合函数计算得出的值（例如平均值、总和等）。这个虚拟字段只存在于查询结果中，而不会对数据库中的数据产生影响。换句话说，当执行查询并获取结果时，每条结果将包含从数据库中选择的实际属性列以及计算得出的虚拟属性列（例如 `avgPrice`）。这些虚拟属性仅在查询结果中可见，不会直接影响数据库中的数据。

### sequelize.fn

`sequelize.fn` 是 Sequelize 提供的一个函数，用于生成聚合函数的 SQL 片段。使用 `sequelize.fn`，可以在查询中使用所有支持的聚合函数（如 COUNT、SUM、AVG、MIN、MAX 等）。

`sequelize.fn` 的语法如下：

```javascript
sequelize.fn(functionName, args)
```

其中，`functionName` 是要调用的聚合函数名称，如 `COUNT`、`SUM`、`AVG`、`MIN`、`MAX` 等；`args` 是可选的函数参数，可以是列名称或常量值。

`sequelize.fn` 可以与 `sequelize.col` 一起使用，用于生成复杂的 SQL 片段和查询语句。它还可以与 `where`、`group`、`having`、`order` 等查询选项一起使用。

### sequelize.col

`sequelize.col` 用于生成对数据库表中列的引用，使用 `sequelize.col`可以在查询中引用特定的列。

`sequelize.col` 的语法如下：

```javascript
sequelize.col(columnName)
```

其中，`columnName` 是要引用的列名称。它可以是字符串形式的列名，也可以是一个包含表名和列名的数组。

下面使用 `sequelize.col` 引用 `products` 表中的 `price` 列：

```javascript
const { col } = require('sequelize');

Product.findAll({
  attributes: [
    [col('price'), 'productPrice']
  ]
});
```

这里使用了 `col` 函数来生成一个对 `price` 列的引用，并将其映射到一个名为 `productPrice` 的属性上。这样，查询结果中就会包含一个带有别名的新属性，它的值是 `price` 列的值。

#### 属性别名

`[col('price'), 'productPrice']` 用于在查询中定义属性别名。它使用了数组的形式来表示一个属性，并包含两个元素：**引用列的表达式**和**属性别名**。在这个例子中，`col('price')` 是一个 `sequelize.col` 函数调用，表示对 `price` 列的引用。'`productPrice'` 是一个字符串，表示希望将 `price` 列的值映射到一个名为 `productPrice` 的属性上。这样，返回的结果将会包含一个名为 `productPrice` 的属性，其中的值是对应的 `price` 列的值。

#### 选择所有列

`col('*')` 表示引用表中的所有列。通常，在 Sequelize 中，我们可以在 `attributes` 数组中使用它来选择查询结果中要返回的列。

```javascript
const { col } = require('sequelize');

Product.findAll({
  attributes: [
    col('*')
  ]
});
```

这里使用 `col('*')` 来引用所有列。这意味着查询结果将包含表中的每个列。

请注意，使用 `col('*')` 将返回表中的所有列，包括主键、外键和其他所有列。如果只想选择特定的列，可以将列名以字符串的形式传递给 `col` 函数，如 `col('columnName')`。

### sequelize.literal

在 Sequelize 中，可以使用 `sequelize.literal` 方法来自定义聚合函数或任何其他数据库原生函数。

`sequelize.literal` 允许在查询中添加原始的 SQL 代码，包括自定义的聚合函数。可以通过将 SQL 代码作为字符串传递给 `sequelize.literal` 来实现。

下面来使用 `sequelize.literal` 自定义一个名为 `customCount` 的聚合函数：

```javascript
const { literal } = require('sequelize');

Product.findAll({
  attributes: [
    [literal('COUNT(*) + 1'), 'customCount']
  ]
});
```

这里使用了 `literal` 函数来生成一个原始的 SQL 表达式 `COUNT(*) + 1`，并将其映射到一个名为 `customCount` 的属性上。

请注意，使用 `sequelize.literal` 时需小心确保代码的安全性和正确性，以避免潜在的风险和错误。请谨慎使用，并确保仔细检查和测试自定义函数的逻辑。

# 模型关联

在 Sequelize 中，模型关联是指在不同表之间建立起的关系，使得可以通过一个模型对象访问到与其相关联的其他模型对象的数据。

Sequelize 支持多种类型的模型关联，包括一对一（One-to-One）、一对多（One-to-Many）和多对多（Many-to-Many）等。通过定义模型之间的关联关系，我们可以方便地执行跨表查询、创建、更新以及删除操作，而无需手动编写复杂的 JOIN 查询。

在 Sequelize 中，定义模型关联的方法有以下几种：

* `hasOne`：定义一对一的关联关系。该方法通常用于声明一个模型拥有唯一的关联模型。
* `hasMany`：定义一对多的关联关系。该方法通常用于声明一个模型拥有多个关联模型。
* `belongsToMany`：定义多对多的关联关系。该方法用于建立两个模型之间的多对多关联关系，需要通过一个中间模型来实现。
* `belongsTo`：定义一对一或一对多的关联关系。该方法通常用于声明一个模型属于另一个模型，也可以用于建立模型之间的一对多关联关系。

例如，假设有两个模型：User（用户）和Post（帖子）。一个用户可以拥有多篇帖子，而一篇帖子只能属于一个用户。在这种情况下，我们可以通过一对多的关系来建立模型关联。

可以通过在模型定义中使用 `hasMany` 和 `belongsTo` 方法来定义一对多的关联关系。下面是一个示例：

```javascript
// User 模型定义
const User = sequelize.define('User', {
  // ...其他属性
});

// Post 模型定义
const Post = sequelize.define('Post', {
  // ...其他属性
});

// 建立一对多关联
User.hasMany(Post, { foreignKey: 'userId' });
Post.belongsTo(User, { foreignKey: 'userId' });
```

在上述示例中，`User.hasMany(Post)` 表示用户模型拥有多个帖子，`Post.belongsTo(User)` 表示帖子模型属于一个用户。通过指定外键 `userId`，Sequelize 将根据该外键进行关联查询。

通过建立模型关联，可以使用框架提供的方法来执行联表查询，例如：

```javascript
// 查询用户及其所有帖子
const user = await User.findByPk(userId, { include: Post });

// 查询帖子及其所属用户
const posts = await Post.findAll({ include: User });
```

这样就可以方便地在相关联的模型之间进行数据查询和操作。


> 更新: 2024-01-09 16:53:07  
> 原文: <https://www.yuque.com/cuggz/feplus/qt9hcga6pnodf6hr>