# tsconfig

Typescript 是 Microsoft 开发的一种编程语言，旨在为 Javascript 语言带来严格的类型检查和类型安全方面的安全性。它是 Javascript 的超集，可以编译为 Javascript。编译选项是 `tsconfig.json` 文件中的属性，可以启用和禁用以改善 Typescript 体验。下面就来看看如何通过设置编译选项来提高 Typescript 代码的质量。

## 前言

在 TypeScript 项目中，`tsconfig.json` 放在项目根目录，它指定了用来编译这个项目的根文件和编译选项。在 `tsconfig.json` 里有以下可配置项：

```json
{
  "compileOnSave": true,
  "files": [],
  "include": [],
  "exclude": [],
  "extends": "",
  "compilerOptions": {}
}
```

这些配置项的作用如下：

* `compileOnSave`：如果设为 `true`，在编辑了项目中文件保存的时候，编辑器会根据 `tsconfig.json` 的配置重新生成文件，不过这个需要编辑器支持。
* `files`：可以配置一个数组列表，里面包含指定文件的相对或绝对路径。编译器在编译的时候只会编译包含在 files 中列出的文件。如果不指定，则取决于有没有设置 include 选项；如果没有 include 选项，则默认会编译根目录以及所有子目录中的文件。这里列出的路径必须是指定文件，而不是某个文件夹，而且不能使用`*`、`?`、`**/`等通配符。
* `include`：include 也可以指定要编译的路径列表，但和 files 的区别在于，这里的路径可以是文件夹，也可以是文件，可以使用相对和绝对路径，而且可以使用通配符。比如`"./src"`即表示要编译 src 文件夹下的所有文件以及子文件夹的文件。
* `exclude`：表示要排除的、不编译的文件，它也可以指定一个列表，规则和 `include` 一样，可以是文件可以是文件夹，可以是相对路径或绝对路径，可以使用通配符。
* `extends`：可以通过指定一个其它的 `tsconfig.json` 文件路径，来继承这个配置文件里的配置，继承来的同名配置会覆盖当前文件定义的配置，所有相对路径都被解析为其所在文件的路径。TS 在 3.2 版本开始，支持继承一个来自 Node.js 包的 `tsconfig.json` 配置文件。
* `compilerOptions`： 用来设置编译选项，是 `tsconfig.json` 配置中最重要的配置项。本文所提到所有选项都需要写在这个配置项中。

## 1. noUnusedLocals

将这个选项设置为 `true` 时，编译器将检查未使用的局部变量并生成错误，其方式类似于 ESLint 中的 `no-unused-vars`。 此编译器选项旨在消除和删除 Typescript 中未使用的变量。 考虑下面的例子：

```typescript
const numHandler = (input: number) => {
  let digits;
  return input;
};
```

在上面的例子中，我们定义了一个名为 `numHandler` 的函数，它接受一个 `number` 类型的参数。 接下来，定义并返回了`input` 参数。 当编译上面的代码时，就会提示以下错误：

```json
error TS6133: 'digits' is declared but its value is never read
```

产生这个错误的原因是声明了 `digits` 变量但并没有使用它。可以通过在代码中的某处使用声明的值，或者通过将 `tsconfig.json` 文件中的 `noUnusedLocals` 选项设置为 `false` 来消除此错误。

## 2. noUnusedParameter

这个编译选项有点类似于 `noUnusedLocals` 选项。 不同之处在于，`noUnusedLocals` 在有未使用的局部变量时产生错误，`noUnusedParameter` 在声明但未使用函数参数时产生错误。 考虑下面的例子：

```typescript
const anExample = (input: string) => {
  const someStrings = 'name'
  return { true, someStrings };
};
```

在上面的例子中，我们定义了一个名为 `anExample` 的函数，它接受一个 `string` 类型的参数。 接下来，定义了一个名为 `someStrings` 的变量，然后返回一个布尔值和定义的变量。 当编译上面的代码时，将会提示以下错误：

```json
error TS6133: 'input' is declared but its value is never read
```

发生这种情况是因为在函数中声明了输入参数而没有使用它。 可以通过使用函数体中声明的参数或将 `tsconfig.json` 文件中的 `noUnusedParameter` 选项设置为 `false` 来消除此错误。

## 3. noImplicitReturns

这个编译选项确保任何带有返回声明的函数都返回一些内容。 当函数中的代码路径不返回值时，此选项会生成错误。考虑下面的例子：

```typescript
function add(input: number, output: number) {
  if (input + output > 0) {
    return input + output;
  }
}
```

在上面的例子中，我们定义了一个带有两个 `number` 类型参数的函数。 接下来，设置一个 `if` 语句，它检查两个参数的和是否大于零，然后返回该和。 将此编译选项设置为 `true` 时，编译器会提示以下类型错误：

```typescript
error TS7030: Not all code paths return a value.
```

Typescript 在这里检测到并非所有代码路径都返回某些内容。当参数的总和不是正数时，就会没有返回语句，这就可能会引发错误，因为上面的函数将返回 `undefined`。 要解决此问题，请确保代码的所有部分都会返回内容。可以这样进行修改：

```typescript
function add(input: number, output: number) {
  if (input + output > 0) {
    return input + output;
  }
  return
}
```

通过使用 `return` 关键字，确保了代码的所有部分都返回一些内容。编译选项帮助我们检测可能的缺失情况，并避免错误。

## 4. noFallthroughCasesInSwitch

当这个选项设置为 `true` 时，只要有 `switch` 语句中缺少 `break` 或 `return` 关键字，这个编译选项就会生成错误。 考虑下面的例子：

```typescript
let name = 'Isaac';
  
switch (name) {
  case 'Mike':
    console.log('name is Mike');
  case 'John':
    console.log('name is John');
    break;           
}
```

当编译上面的代码时，将会提示以下错误：

```typescript
error TS7029: Fallthrough case in switch
```

发生这种情况是因为在第一个 `switch` 语句的分支中缺少了 `break` 关键字。

## 5. strictNullChecks

将这个编译选项设为 `true` 时，`null`和 `undefined` 值不能赋值给非这两种类型的值，别的类型的值也不能赋给它们。 除了 `any` 类型，还有个例外就是 `undefined` 可以赋值给 `void` 类型。这个选项可以帮助我们消除 `Uncaught TypeError` 错误。考虑下面的例子：

```typescript
let title: string;
name = title;
console.log(name);
```

当编译上面的代码时，将会提示以下错误：

```typescript
error TS2454: Variable 'title' is used before being assigned
```

解决这个错误的方法是在使用变量之前为其赋值：

```typescript
let title: string = "Student"
name = title
console.log(name)
```

## 6. noImplicitAny

Typescript 中的每个变量都有一个类型。我们要么显式地定义类型，要么 Typescript 推断它的类型。 考虑下面的例子：

```typescript
function value(a) {
  return;
}
```

在上面的代码中，有一个参数为 `a` 的函数。由于没有为该参数定义类型，因此 Typescript 推断该参数具有 `any` 类型。 将此编译选项设置为 `true` 时，编译器会提示以下错误：

```typescript
error TS7006: Parameter 'a' implicitly has an 'any' type
```

解决此问题的方法就是确保正确定义每个参数的类型。

## 7. noImplicitThis

将这个编译器选项设置为 `true` 时，Typescript 会在不正确地使用 `this` 关键字的情况下或在不清楚 this 所指的位置的地方提示错误。

```typescript
class Person {
  weight: number;
  height: number;
  
  constructor(weight: number, height: number) {
    this.weight = weight;
    this.height = height;
  }
  
  getBodyMassIndex() {
    return function () {
      return this.weight / (this.height * this.height);
    };
  }
}
```

由于 Javascript 中存在作用域，当编译上面的代码时，就会提示以下错误。 这是因为 `this` 关键字的上下文默认没有绑定到任何 `Person` 实例。

```typescript
error TS2683: 'this' implicitly has type 'any' because it does not have a type annotation
```

解决这个问题的方法就是使用箭头函数，因为箭头函数使用其父级的执行上下文：

```typescript
class Person {
  weight: number;
  height: number;
  
  constructor(weight: number, height: number) {
    this.weight = weight;
    this.height = height;
  }
  
  getBodyMassIndex() {
    return () => {
      return this.weight / (this.height * this.height);
    };
  }
}
```

## 8. strictBindCallApply

这个编译选项可以确保使用具有正确参数的 `call()`、`bind()` 和 `apply()` 函数。

```typescript
const numHandler = (a: number) ={
  console.log(`log ${a}!`);
}
numHandler.call(undefined, 'Mike')
```

当把这个编译选项设置为 `true` 的情况下运行上述代码时，将会提示以下错误：

```typescript
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

为了解决这个问题，需要传入正确的参数：

```typescript
const numHandler = (a: number) ={
  console.log(`log ${a}!`)
}
    
numHandler.call(undefined, '25')
```

## 9. strictPropertyInitialization

将这个编译选项设置为 `true` 时，可以确保在构造函数中初始化所有类属性。

```typescript
class User {
    name: string;
    age: number;
    occupation: string | undefined;
    
    constructor(name: string) {
        this.name = name;
    }
}
```

在上面的代码块中有一个 `User` 类，`constructor()` 方法是初始化其实例属性的地方。 当实例化一个类对象时，JavaScript 会自动调用 `constructor()` 方法。 Typescript 要求我们要么初始化定义的属性，要么指定一个 `undefined` 类型。 因此，当编译上面的代码时，将会提示以下错误：

```typescript
error TS2564: Property 'age' has no initializer and is not definitely assigned in the constructor.
```

## 10. useUnknownInCatchVariables

在 Javascript 中，可以抛出错误并在 catch 中捕获它。 通常这将是一个 `error` 实例，默认设置为 `any`。 将 `useUnknownInCatchVariable` 编译选项设置为 `true` 时，它会隐式地将 `catch` 中的任何变量设置为 `unknown` 而不是 `any`。 考虑下面的例子：

```typescript
try {
    throw 'myException'; 
}
catch (err) {
    console.error(err.message); 
}
```

当编译上述代码时，它会将 err 更改为 unknown 类型。 因此会提示以下错误；

```typescript
error TS2571: Object is of type 'unknown'.
```

产生此错误是因为 Typescript 将 err 设置为 unkown。 可以通过以下方式来修复此错误：

* 将 `err` 从 `unknown` 缩小到 `error` 实例

```typescript
try {
    throw 'myException'; 
}
catch (err) { // err: unknown
  if (err instanceof Error) {
    console.error(err.message);
  }
}
```

* 使用类型保护

```typescript
try {
  throw "myException";
} catch (err) {
  // 错误现在缩小为一个字符串
  if (typeof err === "string") {
    console.error(err);
  }
}
```

在 if 检查的帮助下，Typescript 识别出 `typeof err === "string"` 是一种特殊形式的代码，我们在其中显式声明和描述类型，这称为类型保护。

## 11. strictFunctionTypes

当 `strictFunctionTypes` 为 `true` 时，会更彻底地检查函数参数。 Typescript 参数默认是双向协变的，这意味着它们既可以是协变的，也可以是逆变的。 方差是一种深入了解子类型关系的方法。 当参数是协方差时，我们可以将特定类型分配给更广泛的类型（例如将子类型分配给超类型）。 逆变是相反的：可以将更广泛的类型分配给特定类型（例如将超类型分配给子类型）。

```typescript
//strictFunctionTypes: false

interface Animal {
  name: string;
}

interface Dog extends Animal {
  breeds: Array<string>;
}

let getDogName = (dog: Dog) => dog.name;
let getAnimalName = (animal: Animal) => animal.name;

getDogName = getAnimalName;  // Okay
getAnimalName = getDogName;  // Okay
```

上面的代码运行时并没有提示错误，默认情况下参数是双向协变比较的。 超类型 `getAnimalName` 和子类型 `getDogName` 的方法可以相互分配。 如果 `strictFunctionTypes` 设置为 `true`，则 Typescript 的参数进行逆变比较。

```typescript
//strictFunctionTypes : true
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breeds: Array<string>;
}

let getDogName = (dog: Dog) => dog.name;
let getAnimalName = (animal: Animal) => animal.name;

getDogName = getAnimalName; // Okay
getAnimalName = getDogName; // Error
```

当上面的代码运行时，将会提示以下错误：

```typescript
Type '(dog: Dog) => string' is not assignable to type '(animal: Animal) => string'.
Types of parameters 'dog' and 'animal' are incompatible.
Property 'breeds' is missing in type 'Animal' but required in type 'Dog'.
```

这里，`getAnimalName` 是比 `getDogName` 更广泛的函数。 因此，在这种情况下，无法将超类型分配给子类型。 但是，可以将子类型分配给超类型。 大多数时候，函数参数应该是逆变的，而不是双向协变的。 如果启用这个编译选项，Typescript 将不会将函数参数视为双向协变。

## 12. **allowUnreachableCode**

UnReachable 的代码永远不会被执行，例如在 `return` 语句之后的代码。 将将这个编译选项设置为 `true` 时，将忽略无法访问的代码。 相比之下，TypeScript 会在 `allowUnreachableCode` 设置为 `false` 时验证我们的代码路径，确保所有代码都可以访问和使用。 设置为 `true` 时，如果检测到任何无法访问的代码，则会引发错误。

```typescript
const randomNum = (n: number): boolean => {
  if (n > 5) {
    return true;
  } else {
    return false;
  }
    
  return true;
};
```

如果代码被证明无法访问，Typescript 将提示以下警告：

```typescript
error TS7027: Unreachable code detected.
```

## 13. noPropertyAccessFromIndexSignature

当此编译选项设置为 `true` 时，它要求我们使用 `[]` 括号表示法和 `.` 点符号表示法访问未知属性以访问已定义的属性。 这提高了一致性，因为使用点符号访问的属性始终指示现有属性。 `obj.key` 语法如果属性不存在，可以使用 \[] 括号表示法：`obj["key"]`。

```typescript
interface HorseRace {
  breed: "Shetland" | "Hackney" | "Standardbred";
  speed: "fast" | "slow";
  // 尚未定义的属性的索引签名
  [key: string]: string;
}
declare const pick: HorseRace;
pick.breed;
pick.speed;
pick.ownerName;
```

在上面的示例中，我们定义了一个 `HorseRac`e 接口，并为其赋予了一些属性，例如`breed`、`speed`和索引签名（用于未知属性）。 当编译上面的代码时，将会提示以下错误：

```typescript
error TS4111: Property 'ownerName' comes from an index signature, so it must be accessed with ['ownerName'].
```

要修改此错误，需要在调用属性 `ownerName` 时使用括号表示法：

```typescript
pick.breed;
pick.speed;
pick["ownerName"]
```

## 14. exactOptionalPropertyType

默认情况下，Typescript 会忽略一个属性是否被设置为“`undefined`”，因为它没有被定义，或者被定义为了 `undefined`。

```typescript
//exactOptionalPropertyTypes = false

interface Test {
  property?: string;
}
const test1: Test = {};
console.log("property" in test1); //=> false

const test2: Test = { property: undefined };
console.log("property" in test2);
```

上面代码执行的时候不会产生错误，在 `test1` 中，检查是否定义了 `property`； 如果不是，它会打印一个 `false`。 在 test2 中，打印出 `true`，因为定义了 `property` 并将其设置为 `undefined`。 接下来，把 `exactOptionalPropertyTypes` 选项设置为 true：

```typescript
//exactOptionalPropertyTypes = true

interface Test {
  property?: string;
}
const test1: Test = {};
console.log("property" in test1); // false

const test2: Test = { property: undefined };
console.log("property" in test2);  // true
```

编译上述代码时，将会提示以下错误：

```typescript
error TS2375: Type '{ property: undefined; }' is not assignable to type 'Test' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties. Types of property 'property' are incompatible. Type 'undefined' is not assignable to type 'string'.
```

这里，Typescript 不允许定义 `undefined` 的属性。 为了解决这个问题，可以用 undefined 类型定义属性。

```typescript
//exactOptionalPropertyTypes = true

interface Test {
  property?: string | undefined;
}

const test1: Test = {};
console.log("property" in test1); //false

const test2: Test = { property: undefined };
console.log("property" in test2);  //true
```

当启用 `exactOptionalPropertyTypes` 时，Typescript 会意识到这两种具有未定义属性的不同方式。 它还确保如果我们想显式地将属性定义为 `undefined`，则必须首先使用 `undefined` 类型对其进行注释。

## 15. forceConsistentCasingInFileNames

当这个选项设置为 `false` 时，将遵循运行 Typescript 的操作系统 (OS) 的区分大小写规则。 它可以区分大小写（操作系统区分文件名中的小写和大写字符）或不区分大小写（操作系统不区分字符大小写）。 当 forceConsistentCasingInFileNames 选项设置为 true 时，如果尝试导入名称大小写与磁盘上文件名称大小写不同的文件，Typescript 将引发错误。

```typescript
// StringValidator.ts

export interface StringValidator {
  isAcceptable(s: string): boolean;
}
```

```typescript
// ZipCodeValidator.ts

import { StringValidator } from "./stringValidator";

export const numberRegexp = /^[0-9]+$/;

export class ZipCodeValidator implements StringValidator {
  isAcceptable(s: string) {
    return s.length === 5 && numberRegexp.test(s);
  }
}
```

在不考虑文件名大小写的情况下，在上面的代码中导入 `StringValidator.ts` 文件。 如果 `forceConsistentCasingInFileNames` 选项设置为 `true`，将会提示以下错误：

```typescript
error TS1149: File name 'C:/Users/acer/Desktop/workBase/writing/Typescript/tsc/stringValidator.ts' differs from already included file name 'C:/Users/acer/Desktop/workBase/writing/Typescript/tsc/StringValidator.ts' only in casing.
```

要解决此问题，需要在导入文件时确保文件名大小写正确。

## 16. 总结延伸

编译选项大致可以分为五类：**基础选项、类型检查选项、额外检测选项、模块解析选项、Source Map 选项、实验选项。**

### （1）基础选项

* **target**：用于指定编译之后的版本目标，可选值有：`ES3(默认值)`、`ES5`、`ES2015`、`ES2016`、`ES2017`、`ESNEXT`。如果不配置 `target` 项，默认是将代码转译为 `ES3` 的版本，如果设为 `ESNEXT`，则为最新 ES 规范版本。
* **module**：用来指定要使用的模块标准，可选值有`commonjs`、`amd`、`system`、`umd`、`es2015(或写 es6)`。如果不设置 `module` 选项，则如果 `target` 设为 ES6，那么 `module` 默认值为 ES6，否则为 `commonjs`。
* **lib**：用于指定要包含在编译中的库文件。如果要使用 ES6 的新语法，需要引入 ES6 这个库，或者也可以写 ES2015。如果没有指定 `lib` 配置，默认会加载一些库，而加载什么库是受 `target` 影响的。如果 `target` 为 ES5，默认包含的库有`DOM`、`ES5`和`ScriptHost`；如果 `target` 是 ES6，默认引入的库有`DOM`、`ES6`、`DOM.Iterable`和`ScriptHost`。
* **allowJs**：值为 true 或 false，用来指定是否允许编译 JS 文件，默认是 `false`，即不编译 JS 文件。
* **checkJs**：值为 true 或 false，用来指定是否检查和报告 JS 文件中的错误，默认是 false。
* **jsx**：指定jsx代码用于的开发环境: ‘`preserve`’, ‘`react-native`’，‘`react`’，用于编译 jsx 代码
* **jsxFactory**: 指定生成目标为react JSX时，使用的JSX工厂函数，比如 `React.createElement`。
* **declaration**：值为 true 或 false，用来指定是否在编译的时候生成响应的"`.d.ts`"声明文件。如果设为 true，编译每个 ts 文件之后会生成一个 js 文件和一个声明文件。但是 `declaration` 和 `allowJs` 不能同时设为 true。
* **declarationMap**：指定是否为声明文件`.d.ts`生成`.map`文件
* **sourceMap**：值为 true 或 false，用来指定编译时是否生成`.map`文件。
* **outFile**：用于指定将输出文件合并为一个文件，它的值为一个文件路径名，比如设置为`"./dist/main.js"`，则输出的文件为一个 `main.js` 文件。但是要注意，只有设置 `module` 的值为 amd 和 system 模块时才支持这个配置。
* **outDir**：用来指定输出文件夹，值为一个文件夹路径字符串，输出的文件都将放置在这个文件夹。
* **rootDir**：用来指定编译文件的根目录，编译器会在根目录查找入口文件。
* **removeComments**：值为 true 或 false，用于指定是否将编译后的文件中的注释删掉，设为 true 的话即删掉注释，默认为 false。
* **noEmit**：不生成编译文件，很少用。
* **importHelpers**：值为 true 或 false，指定是否引入 `tslib` 里的辅助工具函数，默认为 false。
* **isolatedModules**：值为 true 或 false，指定是否将每个文件作为单独的模块，默认为 true，它不可以和 `declaration` 同时设定。
* **removeComments**：删除所有注释，除了以 `/!*`开头的版权信息。

### （2）<font style="color:#1C1F21;background-color:transparent;">类型检查选项</font>

* **strict**：值为 true 或 false，用于指定是否启动所有类型检查，如果设为 true 则会同时开启前面这几个严格类型检查，默认为 false。
* **noImplicitAny**：值为 true 或 false，如果没有为一些值设置明确的类型，编译器会默认这个值为 any 类型，如果将 `noImplicitAny` 设为 true，则如果没有设置明确的类型会报错。默认值为 false。
* **alwaysStrict**：值为 true 或 false，指定始终以严格模式检查每个模块，并且在编译之后的 JS 文件中加入"`use strict`"，用来告诉浏览器该 JS 为严格模式。
* **strictNullChecks**：值为 true 或 false，当设为 true 时，`null` 和 `undefined` 值不能赋值给非这两种类型的值，别的类型的值也不能赋给它们。 除了 any 类型，还有个例外就是 `undefined` 可以赋值给 `void` 类型。
* **strictFunctionTypes**：值为 true 或 false，用来指定是否使用函数参数双向协变检查。如果开启了 `strictFunctionTypes`，这个赋值就会报错。默认为 false
* \*\*strictPropertyInitialization：\*\*值为 true 或 false，设为 `true` 后会检查类的非 `undefined` 属性是否已经在构造函数里初始化，如果要开启该项，需要同时开启 `strictNullChecks`，默认为 false。
* \*\*strictBindCallApply：\*\*值为 true 或 false，设为 true 后会对 `bind`、`call` 和 `apply` 绑定方法参数的检查是严格检查的。

### <font style="background-color:transparent;">（3）</font><font style="color:#1C1F21;background-color:transparent;">额外检查选项</font>

* **noUnusedLocals**：值为 true 或 false，用于检查是否有定义了但是没有使用的变量，对于这一点的检测，使用 ESLint 可以在书写代码的时候做提示，可以配合使用。默认值为 false。
* **noUnusedParameters**：值为 true 或 false，用于检查是否有在函数体中没有使用的参数，这个也可以配合 ESLint 来做检查，默认是 false。
* **noImplicitReturns**：值为 true 或 false，用于检查函数是否有返回值，设为 true 后，如果函数没有返回值则会提示，默认为 false。
* **noFallthroughCasesInSwitch**：值为 true 或 false，用于检查 switch 中是否有 case 没有使用 break 跳出 switch，默认为 false。
* **noImplicitThis**：当 this 为 any 类型的时候报错。

**<font style="color:#1C1F21;background-color:transparent;"></font>**

**<font style="color:#1C1F21;background-color:transparent;">注意：</font>**<font style="color:#1C1F21;background-color:transparent;">开启了这些检查如果有错会提示但不会报错。</font>

### （4）模块解析选项

* **moduleResolution**：用于选择模块解析策略，有`node`和`classic`两种类型。
* **baseUrl**：用于设置解析非相对模块名称的基本目录，相对模块不会受 baseUrl 的影响。
* **rootDirs**：可以指定一个路径列表，在构建时编译器会将这个路径列表中的路径内容都放到一个文件夹中。
* **typeRoots**：用来指定声明文件或文件夹的路径列表，如果指定了此项，则只有在这里列出的声明文件才会被加载。
* **types**：用来指定需要包含的模块，只有在这里列出的模块声明文件才会被加载进来。
* **allowSyntheticDefaultImports**：值为 true 或 false，用来指定允许从没有默认导出的模块中默认导入。
* \*\*paths：\*\*用于设置模块名到基于 baseUrl 的路径映射。

### （5）source map 选项

* **sourceRoot**：用于指定调试器应该找到 TypeScript 文件而不是源文件位置，这个值会被写进 `.map` 文件里。
* **sourceMap**：生成相应的 .map文件
* **mapRoot**：用于指定调试器找到映射文件而非生成文件的位置，指定 map 文件的根路径，该选项会影响.map 文件中的 sources 属性。
* **inlineSourceMap**：值为 true 或 false，指定是否将 map 文件的内容和 js 文件编译在同一个 js 文件中。如果设为 true，则 map 的内容会以`//# sourceMappingURL=`然后接 base64 字符串的形式插入在 js 文件底部。
* **inlineSources**：值为 true 或 false，用于指定是否进一步将 `.ts` 文件的内容也包含到输出文件中。

### （6）实验选项

控制是否开启一些实验性质的语法。

* **experimentalDecorators**：值是 true 或 false，用于指定是否启用实验性的装饰器特性。
* **emitDecoratorMetadata**：值为 true 或 false，用于指定是否为装饰器提供元数据支持。


> 更新: 2022-08-09 18:00:12  
> 原文: <https://www.yuque.com/cuggz/feplus/bz70ei>