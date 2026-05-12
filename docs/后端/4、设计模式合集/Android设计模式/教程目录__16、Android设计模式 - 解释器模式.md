# 16、Android设计模式 - 解释器模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/16.html
- 分类：设计模式
- 分组：教程目录
解释器模式是一种行为模式，实际开发中用的很少，提供了一种解释语言的语法或表达式的方式。

定义了一个表达式接口，通过接口解释一个特定的上下文。类似于json解析器按一定的语法解析json的。

## 定义

给定一个语言，定义它的文法的一种表示，并定义一个解释器，该解释器使用该表示来解释语言中的句子。

什么是**文法**？文法就是语言的规则，语法。每一个语法都对应一个解释器对象，解释器根据语法来解释相应的句子。

举个例子，那汉语中的主谓宾结构来说，我们经常是自己是什么是这样说的，`我是程序员`，``我是设计师`…。那么，就可以把`我是[职位]`定义为一条文法。解释器一看见这样的文法，就能解析出来你的职业是`[职业]`。

## 使用场景

- 当一个语言需要解释执行，并且该语言中的句子可以表示为一个抽象的语法树时。
- 某些重复出现的问题，可以用一种简单的语言来表示的时候，可以将这个问题转化为一种语法规则下的语句。

## UML

- AbstractExpression:抽象的解析方法。声明一个解析方法，具体实现在具体的子类中完成
- TernimalExprission:实现对文法中与终结符有关的解释操作。
- NonterminalExpression:实现对文法中的非终结符有关的解释操作。
- Context：包含解释器之外的全部信息。
- Client: 解析表达式，构建抽象语法书，执行具体的解释操作等。

## 简单实现

以数字计算为例，``a+b+c`,如果使用解释器模式对表达式进行解释，那么a,b,c可以看做是终结负号，`+`看做是非终结负号。

抽象的解释器，定义每个解释器都有个方法提取结果值

```java
public abstract class ArithmeticExpression {
    public abstract int interpret();
}
```

数字解释器，仅仅解释数字

```java
public class NumExpression extends ArithmeticExpression {
    private int num;
    public NumExpression(int num) {
        this.num = num;
    }
    @Override
    public int interpret() {
        return num;
    }
}
```

抽象的运算符解释器，要求传入两个参数进行计算

```java
public abstract class OperatorExpression extends ArithmeticExpression {
    protected ArithmeticExpression exp1,exp2;
    public OperatorExpression(ArithmeticExpression exp1, ArithmeticExpression exp2) {
        this.exp1 = exp1;
        this.exp2 = exp2;
    }
}
```

一个具体的加法运算符,解析出两个参数的和

```java
public class AddExpression extends OperatorExpression {
    public AddExpression(ArithmeticExpression exp1, ArithmeticExpression exp2) {
        super(exp1, exp2);
    }
    @Override
    public int interpret() {
        return exp1.interpret()+exp2.interpret();
    }
}
```

一个计算类，处理与解析相关的业务

```java
public class Calculator {
    private Stack<ArithmeticExpression> mExp = new Stack<>();
//使用的时候在构造方法里传入要计算的字符串。
    public Calculator(String expression) {
        //准备两个解释器
        ArithmeticExpression exp1, exp2; 
        //将字符串按空格分割
        String[] elements = expression.split(" ");
        for (int i = 0; i < elements.length; i++) {
            switch (elements[i].charAt(0)) {
                case '+':
                //如果是’+‘，说明是个运算符，将上一个数和下一个数相加，也就是当前下标i的i-1和i+1相加。
                //去除栈中前一次压如的数。也就是这个加号之前的计算结果。
                    exp1 = mExp.pop();
                    //取出这个加号后面的数，解析成数字，
                    exp2 = new NumExpression(Integer.valueOf(elements[++i]));
                    //将这两个数进行计算，并将结果压入栈中。
                    mExp.push(new AddExpression(exp1,exp2));
                    break;
                default:
                //如果是数字，就解析为数字，加入栈中。
                    mExp.push(new NumExpression(Integer.valueOf(elements[i])));
                    break;
            }
        }
    }
    public int calculate(){
        return mExp.pop().interpret();
    }
}
```

客户端调用

```java
public class Client {
    public static void main(String[] args) {
        Calculator calculator = new Calculator("1 + 2 + 3");
        System.out.println(calculator.calculate());
    }
}
```

可以看到输出结果是

```java
6
```

如果需要加上减号运算符呢？就子啊实现一个减号的解析器：

```java
public class Subtraction extends OperatorExpression {
    public Subtraction(ArithmeticExpression exp1, ArithmeticExpression exp2) {
        super(exp1, exp2);
    }
    @Override
    public int interpret() {
        return exp1.interpret()-exp2.interpret();
    }
}
```

然后在计算的类里加一种判断：

```java
case '-':
                    exp1 = mExp.pop();
                    exp2 = new NumExpression(Integer.valueOf(elements[++i]));
                    mExp.push(new SubtractionExpression(exp1,exp2));
                    break;
```

客户端调用

```java
public class Client {
    public static void main(String[] args) {
        Calculator calculator = new Calculator("1 + 2 + 3 - 1");
        System.out.println(calculator.calculate());
    }
}
```

可以看到输出结果变成了

```java
5
```

上面只是一个简单的算术运算的解析。根据这个模式，可以增加很多运算法则，只要创建响应的解释器就可以。

由于解释器和文法是一一对应的，所以一个解释器只负责解析一种文法。我们可以为一种文法创建多个解释器，但不能用一个解释器解析多重文法。

解释器值负责解析单个的文法，所以解析树的建立就有距离的使用者去根据实际情况构建了。

## 总结

### 优点

- 拓展性很灵活，需要增加新的解释器的时候，直接实现一个新的就行了，然后在实际运用中灵活构建语法树来运用。

### 缺点

- 每一个文法都至少对应一个解释器，会产生大量的类，维护困难。
- 对于复杂的文法，要构建语法书会非常繁琐，甚至需要构建多颗语法树。
