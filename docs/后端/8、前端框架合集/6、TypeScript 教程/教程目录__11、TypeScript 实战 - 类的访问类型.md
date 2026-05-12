# 11、TypeScript 实战 - 类的访问类型
- 来源：https://ddkk.com/zhuanlan/qianduan/typescript/1/11.html
- 分类：前端框架
- 分组：教程目录
## class类中的访问类型(public 、private、和protected)

## public

- 从英文字面的解释就是公共的或者说是公众的，在程序里的意思就是允许在类的内部和外部被调用
- 如果在class中不给访问属性作任何定义,那么默认的就是public访问属性

```java
class person {
   name:string
   sayHi(){
       return this.name +"你好！"
        // this.name 就是内部调用   
   }
}
let Person = new person()
// 外部调用
Person.name = "小哈"
console.log(Person.name) 
// 运行结果为：小哈
console.log(Person.sayHi())
//运行结果为：小哈你好！
```

## private

- 只允许再类的内部被调用，外部不允许调用

```java
class person {
   private content="我是人类"
   private sayHi(){
      return this.content //此处为内部调用是允许的
   }
}
let Person = new person()
Person.content = "aaa" //错误的使用
// 这样就是错误的格式 因为 属性“content”为私有属性，只能在类“person”中访问
```

## protected

- 允许在类内及继承的子类中使用

```java
class person {
   protected content = "我是人类"
   sayHi(){
      return this.content //内部可以访问
   }
}
let Person = new person()
//Person.content="我是一个人" //外部不行
class xiaoHa extends person{
   public sayHi(){
      return this.content //在继承的子类中可以调用
   }
}
let XH= new xiaoHa()
console.log(XH.sayHi())
//打印结果为:我是人类
```
