# 08、TypeScript 实战 - interface 接口1
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/8.html
- 分类：前端框架
- 分组：教程目录
## 现有需求:某技术公式招聘女程序员 要求年龄不小于23岁 工作年限不低于三年 才有面试资格

```java
那我们写了个方法
const Girl = (name:string,age:number,workingAge:number)=>{
     age>=23 && workingAge>=3 && console.log(name+"OK你已获取面试资格");
    (age< 23 || workingAge<3) && console.log(name+"ON你不符合面试要求")
}
Girl("小嘻",23,3)
此时ts文件运行的结果为:
	小嘻OK你已获取面试资格
```

## 此时老板说想要看到面试者的个人信息

```java
 于是我们又写了一个方法
 const LookResume=(name:string,age:number,workingAge:number)=>{
    console.log("姓名:"+name+",年龄:"+age+",工作年限:"+workingAge)
}
LookResume("小嘻",23,3)
此时ts文件运行的两个方法的结果为:
	小嘻OK你已获取面试资格
	姓名:小嘻,年龄:23,工作年限:3
```

## 此时问题就来了，但是发现Girl和LookResume的函数中有相同的代码 (name:string,age:number,workingAge:number)

## 此时我们就可以进行优化一下，就在优化的同时，老板说，如果能看到面试者是否恋爱是最好的，看不到也没关系，不作为必选值

```java
那作为程序员的我们必须整合优化了
此时可以使用interface接口进行定义类别
interface Resume{
    name:string;
    age:number,
    workingAge:number,
    // 接口非选值 是否恋爱
    spouse ?:string
}
 const girl ={
     name:"小哈",
     age:23,
     workingAge:3,
 }
 const Girl = (girl:Resume)=>{
    girl.age>=23 && girl.workingAge>=3 && console.log(girl.name+"OK你已获取面试资格");
    (girl.age< 23 || girl.workingAge<3) && console.log(girl.name+"ON你不符合面试要求")
}
const LookResume=(girl:Resume)=>{
    console.log("姓名:"+girl.name+",年龄:"+girl.age+",工作年限:"+girl.workingAge)
    girl.spouse&&console.log(girl.name+"是否恋爱:"+girl.spouse)
}
LookResume(girl)
Girl(girl)
此时ts文件运行的结果为:
	姓名:小哈,年龄:23,工作年限:3
	小哈是否恋爱:否       
	小哈OK你已获取面试资格
```

## 这样就完成了优化

## 注意：在上面interface接口中,恋爱情况作为非选值，要注意相应的写法

## 区别：虽然interface接口和type alias用法相似，但type alias可以直接随意定义例如type Resume = string，而interface接口必须为对象的形式
