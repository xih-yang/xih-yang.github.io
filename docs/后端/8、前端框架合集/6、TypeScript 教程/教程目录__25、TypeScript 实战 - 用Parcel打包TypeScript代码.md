# 25、TypeScript 实战 - 用Parcel打包TypeScript代码
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/25.html
- 分类：前端框架
- 分组：教程目录
第二十篇文章中实现了import方式的引入，但是配置起来相当的复杂

使用我们Parcel这个打包工具一切变得简单起来了

## 新建一个项目

这个步骤在第22篇博客中有详细的提到

**1、** 新建立一个项目`TSTest`,在桌面新建立一个文件夹，然后在VSCode中打开；

**2、** 打开终端，输入`npminit-y`,创建`package.json`文件；

**3、** 在终端中输入`tsc--init`,创建`tsconfig.json`文件；

**4、** 修改t`sconfig.json`配置`rootDir`和`outDir`.；

**5、** 新建`src`文件夹，在里边建立`index.html`,`page.ts`文件；

**6、** 编写`index.html`文件，并引入`page.ts`文件；

**7、** 编写`page.ts`文件；

index.html 文件代码：

```java
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="./page.ts"></script>
</head>
<body>
</body>
</html>
```

page.ts文件代码：

```java
class Content {
    cname:string = "哈哈小猿"
    returnName():string{
            return this.cname
    }
}
let content = new Content()
console.log(content.returnName());
```

现在我们并不能正常的预览出效果，我们需要`Parcel`的帮忙。

## Parcel 的安装和使用

可以通过`npm`或者`yarn`来进行安装

```java
npm add --dev parcel@next
```

修改`package.json`里边的代码。

```java
{
  "scripts": {
    "test": "parcel ./src/index.html"
  },
}
```

这个意思就是使用`parcel`对`index.html`进行一个编译。

然后打开终端输入`npm test`,这时候终端会给出一个地址`http://localhost:1234`,把地址放到浏览器上，可以看到浏览器的控制台会输出`哈哈小猿`。

这说明`Parcel`会自动对`index.html`中引入的`TypeScript`文件进行编译，然后打包好后，就可以直接使用了
