# ESLint 异步

在 JavaScript 编写调试异步代码时，ESlint 可以帮我们及时发现一些错误。即使没有在项目中用到这些规则，理解它们的含义也将有助于帮助我们更好地理解和编写异步代码。

## 异步代码的ESLint规则

以下规则默认随ESLint一起提供，可以在 `.eslintrc` 配置文件中启用它们。

### 1. no-async-promise-executor

此规则不允许将async函数传递给new Promise构造函数。

```javascript
// ❌
new Promise(async (resolve, reject) => {});

// ✅
new Promise((resolve, reject) => {});
```

虽然将异步函数传递给 Promise 构造函数在技术上是没有问题的，但由于以下两个原因，这样做通常都是错误的：

* 如果异步函数抛出错误，错误将会丢失而不会被新构造的 Promise 拒绝；
* 如果 await 在构造函数内部使用，包装 Promise 是不必要的，可以将其删除。

### 2. no-await-in-loop

此规则不允许在循环内使用 await。

当对可迭代的每个元素执行操作并等待异步任务时，通常表明程序没有充分利用JavaScript的事件驱动架构。通过并行执行这些任务，可以大大提高代码的效率。

```javascript
// ❌
for (const url of urls) {
  const response = await fetch(url);
}

// ✅
const responses = [];
for (const url of urls) {
  const response = fetch(url);
  responses.push(response);
}

await Promise.all(responses);
```

当确实需要按照顺序执行任务的情况下，建议使用内联注释禁用此规则：

```javascript
// eslint-disable-line no-await-in-loop。
```

### 3. no-promise-executor-return

此规则不允许在 Promise 构造函数中返回值。

```javascript
// ❌
new Promise((resolve, reject) => {
  return result;
});

// ✅
new Promise((resolve, reject) => {
  resolve(result);
});
```

在 Promise 构造函数中返回的值不能被使用并且不会以任何方式影响 Promise。 应该将值传递给 resolve，如果发生错误，则调用 reject 并显示错误。

此规则不会阻止在 Promise 构造函数的嵌套回调中返回值。 始终确保使用 resolve 或 reject 来完成 Promise。

### 4. require-atomic-updates

此规则不允许由于 await 或 yield 的使用而可能导致出现竞态条件的赋值。

来看下面的例子，totalPosts 的最终值是多少？

```javascript
// ❌
let totalPosts = 0;

async function getPosts(userId) {
  const users = [{ id: 1, posts: 5 }, { id: 2, posts: 3 }];
  await sleep(Math.random() * 1000);
  return users.find((user) => user.id === userId).posts;
}

async function addPosts(userId) {
  totalPosts += await getPosts(userId);
}

await Promise.all([addPosts(1), addPosts(2)]);
console.log('Post count:', totalPosts);
```

这里 totalPosts 不会打印 8，而会打印 5 和 3。问题就在于读取和更新 totalPosts 之间存在时间间隔。 这会导致竞态条件，使得在单独的函数调用中更新值时，更新不会反映在当前函数范围中。 因此，这两个函数都将它们的结果添加到初始值为 0 的 totalPosts 中。

为了避免这种竞态条件，应该确保在更新变量的同时读取变量：

```javascript
// ✅
let totalPosts = 0;

async function getPosts(userId) {
  const users = [{ id: 1, posts: 5 }, { id: 2, posts: 3 }];
  await sleep(Math.random() * 1000);
  return users.find((user) => user.id === userId).posts;
}

async function addPosts(userId) {
  const posts = await getPosts(userId);
  totalPosts += posts; // variable is read and immediately updated
}

await Promise.all([addPosts(1), addPosts(2)]);
console.log('Post count:', totalPosts);
```

### 5. max-nested-callbacks

此规则会强制回调的最大嵌套深度。 换句话说，这条规则可以防止回调地狱。

```javascript
/* eslint max-nested-callbacks: ["error", 3] */

// ❌
async1((err, result1) => {
  async2(result1, (err, result2) => {
    async3(result2, (err, result3) => {
      async4(result3, (err, result4) => {
        console.log(result4);
      });
    });
  });
});

// ✅
const result1 = await asyncPromise1();
const result2 = await asyncPromise2(result1);
const result3 = await asyncPromise3(result2);
const result4 = await asyncPromise4(result3);
console.log(result4);
```

深层的嵌套使代码难以阅读和维护。 在编写JavaScript 异步代码时，可以将回调重构为 Promise 并使用 async/await 语法。

### 6. no-return-await

此规则不允许返回不必要的 await。

```javascript
// ❌
async () => {
  return await getUser(userId);
}

// ✅
async () => {
  return getUser(userId);
}
```

等待一个 Promise 并立即返回它是没有必要的，因为从异步函数返回的所有值都包含在一个 Promise 中。 因此，可以直接返回 Promise。

此规则的一个例外情况就是当有 try...catch 语句时， 删除 await 关键字将导致不会捕获 Promise 拒绝的原因。 在这种情况下，建议将结果分配给变量以明确意图。

```javascript
// 👎
async () => {
  try {
    return await getUser(userId);
  } catch (error) {
    // 处理错误
  }
}

// 👍
async () => {
  try {
    const user = await getUser(userId);
    return user;
  } catch (error) {
    // 处理错误
  }
}
```

### 7. prefer-promise-reject-errors

此规则在拒绝 Promise 时强制使用 Error 对象。

```javascript
// ❌
Promise.reject('An error occurred');

// ✅
Promise.reject(new Error('An error occurred'));
```

最好的做法就是始终拒绝带有 Error 对象的 Promise。 这样做将更容易跟踪错误的来源，因为 Error 对象存储在堆栈跟踪中。

## Node.js 特定规则

以下规则是 `eslint-plugin-node` 插件为 Node.js 提供的附加 ESLint 规则。 要使用它们，需要安装插件并将其添加到 `.eslintrc` 配置文件中的 `plugins` 数组中。

### 8. node/handle-callback-err

此规则在回调中强制执行错误处理。

```javascript
// ❌
function callback(err, data) {
  console.log(data);
}

// ✅
function callback(err, data) {
  if (err) {
    console.log(err);
    return;
  }

  console.log(data);
}
```

在 Node.js 中，通常将错误作为第一个参数传递给回调函数。 忘记处理错误可能会导致应用程序行为异常。

当函数的第一个参数命名为 err 时会触发此规则。可以通过在 `.eslintrc` 文件中为规则提供第二个参数来更改默认配置：

```javascript
node/handle-callback-err: ["error", "^(e|err|error)$"]
```

### 9. node/no-callback-literal

此规则强制使用 Error 对象作为第一个参数调用回调函数。 如果没有 Error，会接受 null 或 undefined 。

```javascript
// ❌
cb('An error!');
callback(result);

// ✅
cb(new Error('An error!'));
callback(null, result);
```

此规则可以确保不会意外调用以非 error 作为第一个参数的回调函数。 根据 error 优先回调约定，回调函数的第一个参数应该是 error，如果没有 Error，则为 null 或 undefined。

仅当函数命名为 cb 或 callback 时才会触发此规则。

### 10. node/no-sync

此规则不允许在存在异步替代方案的 Node.js 核心 API 中使用同步方法。

```javascript
// ❌
const file = fs.readFileSync(path);

// ✅
const file = await fs.readFile(path);
```

在 Node.js 中对 I/O 操作使用同步方法会阻塞事件循环。 在大多数 Web 应用程序中，执行 I/O 操作时会使用异步方法。

在某些应用程序中，可以使用同步方法。 可以在代码文件顶部使用以下代码来禁用此规则：

```javascript
/* eslint-disable node/no-sync */ 
```

## TypeScript 特定规则

以下规则仅适用于 TypeScript 项目。

### 11. @typescript-eslint/await-thenable

此规则不允许 await 不是 Promise 的函数或值。

```javascript
// ❌
function getValue() {
  return someValue;
}

await getValue();

// ✅
async function getValue() {
  return someValue;
}

await getValue();
```

虽然在 JavaScript 中 await 非 Promise 值是有效的（将立即解析），但它通常表示代码逻辑是错误的，例如忘记添加括号来调用返回 Promise 的函数。

### 12. @typescript-eslint/no-floating-promises

此规则强制 Promises 添加错误处理程序。

```javascript
myPromise()
  .then(() => {});

// ✅
myPromise()
  .then(() => {})
  .catch(() => {});
```

此规则可防止代码库中的浮动 Promises。 浮动 Promise 是没有任何代码来处理潜在错误的 Promise。

### 13. @typescript-eslint/no-misused-promises

此规则不允许将 Promise 传递到并非旨在处理它们的地方，例如 if 条件：

```javascript
// ❌
if (getUserFromDB()) {}

// ✅ 👎
if (await getUserFromDB()) {}

// ✅ 👍
const user = await getUserFromDB();
if (user) {}
```

此规则可防止忘记添加 await 异步函数。虽然该规则确实允许在 if 条件中 await，但建议将结果分配给一个变量并在条件中使用该变量以提高可读性。

### 14. @typescript-eslint/promise-function-async

此规则强制返回 Promise 的是 async 函数。

```javascript
// ❌
function doSomething() {
  return somePromise;
}

// ✅
async function doSomething() {
  return somePromise;
}
```

返回 Promise 的非异步函数可能会抛出 Error 对象并返回被拒绝的 Promise。 通常不会编写代码来处理这两种情况。 此规则确保函数返回被拒绝的 Promise 或抛出 Error，但绝不会两者都有。


> 更新: 2022-04-17 23:29:34  
> 原文: <https://www.yuque.com/cuggz/feplus/hh64nw>