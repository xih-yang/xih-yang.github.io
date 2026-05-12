# 05、JDK 17 新特性：Switch 模式匹配实战：与密封类结合使用的完整案例
- 来源：https://ddkk.com/zhuanlan/java/java17/5.html
- 分类：JDK 17 新特性
- 分组：教程目录
- 日期：2025-11-28
前面几篇文章咱聊了密封类和模式匹配的基础用法，今天鹏磊来给大伙儿整几个完整的实战案例，看看这俩特性在实际项目里怎么用。光看语法没用，得看实际代码才能理解它们的威力。

密封类和模式匹配配合使用，能解决很多实际问题。比如表达式求值、状态机、配置解析这些场景，用传统方式写代码又臭又长，用这俩特性写起来简洁多了，类型安全也有保障。编译器还能帮你检查完整性，漏掉情况会报错，这比手动检查靠谱多了。

## 案例一：完整的表达式求值器

先来个表达式求值器，这是密封类 + 模式匹配的经典应用：

```java
// 定义表达式为密封接口
public sealed interface Expr permits Literal, Variable, Add, Subtract, Multiply, Divide {
    // Expr 的基础方法
}
// 字面量表达式
public record Literal(double value) implements Expr {
    // Literal 的实现，value 是字面量的值
}
// 变量表达式
public record Variable(String name) implements Expr {
    // Variable 的实现，name 是变量名
}
// 加法表达式
public record Add(Expr left, Expr right) implements Expr {
    // Add 的实现，left 和 right 是左右操作数
}
// 减法表达式
public record Subtract(Expr left, Expr right) implements Expr {
    // Subtract 的实现，left 和 right 是左右操作数
}
// 乘法表达式
public record Multiply(Expr left, Expr right) implements Expr {
    // Multiply 的实现，left 和 right 是左右操作数
}
// 除法表达式
public record Divide(Expr left, Expr right) implements Expr {
    // Divide 的实现，left 和 right 是左右操作数
}
// 表达式求值器
public class ExprEvaluator {
    // 求值表达式
    public double evaluate(Expr expr, java.util.Map<String, Double> vars) {
        return switch (expr) {
            case Literal(double value) -> value;  // 字面量直接返回值
            case Variable(String name) -> vars.getOrDefault(name, 0.0);  // 变量从映射中取值
            case Add(Expr left, Expr right) -> {
                // 递归求值左右操作数
                double leftValue = evaluate(left, vars);  // 求左操作数的值
                double rightValue = evaluate(right, vars);  // 求右操作数的值
                yield leftValue + rightValue;  // 返回相加结果
            }
            case Subtract(Expr left, Expr right) -> {
                // 递归求值左右操作数
                double leftValue = evaluate(left, vars);  // 求左操作数的值
                double rightValue = evaluate(right, vars);  // 求右操作数的值
                yield leftValue - rightValue;  // 返回相减结果
            }
            case Multiply(Expr left, Expr right) -> {
                // 递归求值左右操作数
                double leftValue = evaluate(left, vars);  // 求左操作数的值
                double rightValue = evaluate(right, vars);  // 求右操作数的值
                yield leftValue * rightValue;  // 返回相乘结果
            }
            case Divide(Expr left, Expr right) -> {
                // 递归求值左右操作数
                double leftValue = evaluate(left, vars);  // 求左操作数的值
                double rightValue = evaluate(right, vars);  // 求右操作数的值
                if (rightValue == 0) {
                    throw new ArithmeticException("除以零");  // 检查除零错误
                }
                yield leftValue / rightValue;  // 返回相除结果
            }
        };
    }
    // 优化表达式：常量折叠
    public Expr optimize(Expr expr) {
        return switch (expr) {
            case Literal(double value) -> expr;  // 字面量不需要优化
            case Variable(String name) -> expr;  // 变量不需要优化
            case Add(Literal(double left), Literal(double right)) -> {
                // 两个常量相加，直接计算结果
                yield new Literal(left + right);  // 返回新的字面量
            }
            case Subtract(Literal(double left), Literal(double right)) -> {
                // 两个常量相减，直接计算结果
                yield new Literal(left - right);  // 返回新的字面量
            }
            case Multiply(Literal(double left), Literal(double right)) -> {
                // 两个常量相乘，直接计算结果
                yield new Literal(left * right);  // 返回新的字面量
            }
            case Divide(Literal(double left), Literal(double right)) -> {
                // 两个常量相除，直接计算结果
                if (right == 0) {
                    throw new ArithmeticException("除以零");  // 检查除零错误
                }
                yield new Literal(left / right);  // 返回新的字面量
            }
            case Add(Expr left, Expr right) -> {
                // 递归优化左右操作数
                Expr optimizedLeft = optimize(left);  // 优化左操作数
                Expr optimizedRight = optimize(right);  // 优化右操作数
                yield new Add(optimizedLeft, optimizedRight);  // 返回优化后的表达式
            }
            case Subtract(Expr left, Expr right) -> {
                // 递归优化左右操作数
                Expr optimizedLeft = optimize(left);  // 优化左操作数
                Expr optimizedRight = optimize(right);  // 优化右操作数
                yield new Subtract(optimizedLeft, optimizedRight);  // 返回优化后的表达式
            }
            case Multiply(Expr left, Expr right) -> {
                // 递归优化左右操作数
                Expr optimizedLeft = optimize(left);  // 优化左操作数
                Expr optimizedRight = optimize(right);  // 优化右操作数
                yield new Multiply(optimizedLeft, optimizedRight);  // 返回优化后的表达式
            }
            case Divide(Expr left, Expr right) -> {
                // 递归优化左右操作数
                Expr optimizedLeft = optimize(left);  // 优化左操作数
                Expr optimizedRight = optimize(right);  // 优化右操作数
                yield new Divide(optimizedLeft, optimizedRight);  // 返回优化后的表达式
            }
        };
    }
    // 格式化表达式为字符串
    public String format(Expr expr) {
        return switch (expr) {
            case Literal(double value) -> String.valueOf(value);  // 字面量直接转字符串
            case Variable(String name) -> name;  // 变量直接返回变量名
            case Add(Expr left, Expr right) -> {
                // 格式化加法表达式
                String leftStr = format(left);  // 格式化左操作数
                String rightStr = format(right);  // 格式化右操作数
                yield "(" + leftStr + " + " + rightStr + ")";  // 返回格式化结果
            }
            case Subtract(Expr left, Expr right) -> {
                // 格式化减法表达式
                String leftStr = format(left);  // 格式化左操作数
                String rightStr = format(right);  // 格式化右操作数
                yield "(" + leftStr + " - " + rightStr + ")";  // 返回格式化结果
            }
            case Multiply(Expr left, Expr right) -> {
                // 格式化乘法表达式
                String leftStr = format(left);  // 格式化左操作数
                String rightStr = format(right);  // 格式化右操作数
                yield "(" + leftStr + " * " + rightStr + ")";  // 返回格式化结果
            }
            case Divide(Expr left, Expr right) -> {
                // 格式化除法表达式
                String leftStr = format(left);  // 格式化左操作数
                String rightStr = format(right);  // 格式化右操作数
                yield "(" + leftStr + " / " + rightStr + ")";  // 返回格式化结果
            }
        };
    }
}
// 使用示例
public class ExprExample {
    public static void main(String[] args) {
        ExprEvaluator evaluator = new ExprEvaluator();  // 创建求值器
        // 创建表达式: (x + 2) * 3
        Expr expr = new Multiply(
            new Add(new Variable("x"), new Literal(2)),  // x + 2
            new Literal(3)  // 3
        );
        // 设置变量值
        java.util.Map<String, Double> vars = new java.util.HashMap<>();  // 创建变量映射
        vars.put("x", 5.0);  // 设置 x = 5
        // 求值
        double result = evaluator.evaluate(expr, vars);  // 求值表达式
        System.out.println("结果: " + result);  // 输出: 结果: 21.0
        // 优化表达式
        Expr optimized = evaluator.optimize(expr);  // 优化表达式
        System.out.println("优化后: " + evaluator.format(optimized));  // 输出优化后的表达式
        // 格式化表达式
        System.out.println("表达式: " + evaluator.format(expr));  // 输出: 表达式: ((x + 2) * 3)
    }
}
```

看，完整的表达式求值器，包含求值、优化、格式化三个功能，代码清晰，类型安全，编译器还能检查完整性。

## 案例二：订单状态机

订单状态机是密封类 + 模式匹配的另一个经典应用：

```java
// 定义订单状态为密封接口
public sealed interface OrderState permits Pending, Paid, Shipped, Delivered, Cancelled {
    // OrderState 的基础方法
    String getStatusName();  // 获取状态名称
    boolean canTransitionTo(OrderState newState);  // 检查是否可以转换到新状态
}
// 待支付状态
public record Pending() implements OrderState {
    @Override
    public String getStatusName() {
        return "待支付";  // 返回状态名称
    }
    @Override
    public boolean canTransitionTo(OrderState newState) {
        return switch (newState) {
            case Paid() -> true;  // 可以转换到已支付
            case Cancelled() -> true;  // 可以转换到已取消
            default -> false;  // 其他状态不能转换
        };
    }
}
// 已支付状态
public record Paid() implements OrderState {
    @Override
    public String getStatusName() {
        return "已支付";  // 返回状态名称
    }
    @Override
    public boolean canTransitionTo(OrderState newState) {
        return switch (newState) {
            case Shipped() -> true;  // 可以转换到已发货
            case Cancelled() -> true;  // 可以转换到已取消
            default -> false;  // 其他状态不能转换
        };
    }
}
// 已发货状态
public record Shipped() implements OrderState {
    @Override
    public String getStatusName() {
        return "已发货";  // 返回状态名称
    }
    @Override
    public boolean canTransitionTo(OrderState newState) {
        return switch (newState) {
            case Delivered() -> true;  // 可以转换到已送达
            default -> false;  // 其他状态不能转换
        };
    }
}
// 已送达状态
public record Delivered() implements OrderState {
    @Override
    public String getStatusName() {
        return "已送达";  // 返回状态名称
    }
    @Override
    public boolean canTransitionTo(OrderState newState) {
        return false;  // 已送达是终态，不能转换
    }
}
// 已取消状态
public record Cancelled() implements OrderState {
    @Override
    public String getStatusName() {
        return "已取消";  // 返回状态名称
    }
    @Override
    public boolean canTransitionTo(OrderState newState) {
        return false;  // 已取消是终态，不能转换
    }
}
// 订单类
public class Order {
    private String orderId;  // 订单ID
    private OrderState state;  // 当前状态
    public Order(String orderId) {
        this.orderId = orderId;  // 初始化订单ID
        this.state = new Pending();  // 初始状态为待支付
    }
    // 转换状态
    public void transitionTo(OrderState newState) {
        if (!state.canTransitionTo(newState)) {
            throw new IllegalStateException(
                "不能从 " + state.getStatusName() + " 转换到 " + newState.getStatusName()
            );  // 状态转换不合法，抛异常
        }
        this.state = newState;  // 更新状态
        onStateChanged(state);  // 触发状态变更事件
    }
    // 状态变更处理
    private void onStateChanged(OrderState newState) {
        switch (newState) {
            case Pending() -> {
                System.out.println("订单 " + orderId + " 待支付");  // 处理待支付状态
                // 发送待支付通知
            }
            case Paid() -> {
                System.out.println("订单 " + orderId + " 已支付");  // 处理已支付状态
                // 准备发货
            }
            case Shipped() -> {
                System.out.println("订单 " + orderId + " 已发货");  // 处理已发货状态
                // 发送物流通知
            }
            case Delivered() -> {
                System.out.println("订单 " + orderId + " 已送达");  // 处理已送达状态
                // 发送确认收货通知
            }
            case Cancelled() -> {
                System.out.println("订单 " + orderId + " 已取消");  // 处理已取消状态
                // 处理退款
            }
        }
    }
    public OrderState getState() {
        return state;  // 返回当前状态
    }
}
// 使用示例
public class OrderExample {
    public static void main(String[] args) {
        Order order = new Order("ORD-001");  // 创建订单
        // 状态转换
        order.transitionTo(new Paid());  // 支付
        order.transitionTo(new Shipped());  // 发货
        order.transitionTo(new Delivered());  // 送达
        // 尝试非法转换会抛异常
        try {
            order.transitionTo(new Pending());  // 已送达不能回到待支付
        } catch (IllegalStateException e) {
            System.out.println("错误: " + e.getMessage());  // 输出错误信息
        }
    }
}
```

状态机用密封类 + 模式匹配实现，状态转换规则清晰，类型安全，编译器还能检查完整性。

## 案例三：配置解析器

配置解析器也能用密封类 + 模式匹配实现：

```java
// 定义配置值为密封接口
public sealed interface ConfigValue permits ConfigString, ConfigNumber, ConfigBoolean, ConfigArray, ConfigObject {
    // ConfigValue 的基础方法
}
// 字符串配置值
public record ConfigString(String value) implements ConfigValue {
    // ConfigString 的实现
}
// 数字配置值
public record ConfigNumber(double value) implements ConfigValue {
    // ConfigNumber 的实现
}
// 布尔配置值
public record ConfigBoolean(boolean value) implements ConfigValue {
    // ConfigBoolean 的实现
}
// 数组配置值
public record ConfigArray(java.util.List<ConfigValue> elements) implements ConfigValue {
    // ConfigArray 的实现
}
// 对象配置值
public record ConfigObject(java.util.Map<String, ConfigValue> properties) implements ConfigValue {
    // ConfigObject 的实现
}
// 配置解析器
public class ConfigParser {
    // 解析配置值
    public ConfigValue parse(String json) {
        // 简化实现，实际应该用 JSON 解析库
        // 这里只是演示模式匹配的用法
        return parseValue(json.trim());  // 解析配置值
    }
    private ConfigValue parseValue(String str) {
        if (str.startsWith("\"") && str.endsWith("\"")) {
            // 字符串值
            String value = str.substring(1, str.length() - 1);  // 去掉引号
            return new ConfigString(value);  // 返回字符串配置值
        } else if (str.equals("true") || str.equals("false")) {
            // 布尔值
            boolean value = Boolean.parseBoolean(str);  // 解析布尔值
            return new ConfigBoolean(value);  // 返回布尔配置值
        } else {
            try {
                // 尝试解析为数字
                double value = Double.parseDouble(str);  // 解析数字
                return new ConfigNumber(value);  // 返回数字配置值
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("无法解析: " + str);  // 解析失败抛异常
            }
        }
    }
    // 获取配置值
    public <T> T getValue(ConfigValue config, Class<T> type) {
        return switch (config) {
            case ConfigString(String value) when type == String.class -> {
                // 字符串类型
                @SuppressWarnings("unchecked")
                T result = (T) value;  // 强制转换
                yield result;  // 返回结果
            }
            case ConfigNumber(double value) when type == Double.class -> {
                // 数字类型
                @SuppressWarnings("unchecked")
                T result = (T) Double.valueOf(value);  // 强制转换
                yield result;  // 返回结果
            }
            case ConfigBoolean(boolean value) when type == Boolean.class -> {
                // 布尔类型
                @SuppressWarnings("unchecked")
                T result = (T) Boolean.valueOf(value);  // 强制转换
                yield result;  // 返回结果
            }
            default -> throw new IllegalArgumentException("类型不匹配");  // 类型不匹配抛异常
        };
    }
    // 格式化配置值
    public String format(ConfigValue config) {
        return switch (config) {
            case ConfigString(String value) -> "\"" + value + "\"";  // 字符串加引号
            case ConfigNumber(double value) -> String.valueOf(value);  // 数字转字符串
            case ConfigBoolean(boolean value) -> String.valueOf(value);  // 布尔值转字符串
            case ConfigArray(java.util.List<ConfigValue> elements) -> {
                // 格式化数组
                StringBuilder sb = new StringBuilder("[");  // 开始数组
                for (int i = 0; i < elements.size(); i++) {
                    sb.append(format(elements.get(i)));  // 递归格式化元素
                    if (i < elements.size() - 1) {
                        sb.append(", ");  // 添加逗号
                    }
                }
                sb.append("]");  // 结束数组
                yield sb.toString();  // 返回格式化结果
            }
            case ConfigObject(java.util.Map<String, ConfigValue> properties) -> {
                // 格式化对象
                StringBuilder sb = new StringBuilder("{");  // 开始对象
                var entries = properties.entrySet().iterator();  // 获取条目迭代器
                while (entries.hasNext()) {
                    var entry = entries.next();  // 获取下一个条目
                    sb.append("\"").append(entry.getKey()).append("\": ");  // 添加键
                    sb.append(format(entry.getValue()));  // 递归格式化值
                    if (entries.hasNext()) {
                        sb.append(", ");  // 添加逗号
                    }
                }
                sb.append("}");  // 结束对象
                yield sb.toString();  // 返回格式化结果
            }
        };
    }
}
```

配置解析器用密封类 + 模式匹配实现，类型安全，代码清晰，处理复杂配置也方便。

## 总结

这几个实战案例展示了密封类 + 模式匹配的强大之处。表达式求值器展示了如何用模式匹配处理递归数据结构，订单状态机展示了如何用密封类控制状态转换，配置解析器展示了如何用模式匹配处理不同类型的数据。

这些案例的共同点是：代码简洁、类型安全、编译器能检查完整性。如果你漏掉了某个情况，编译器会报错，这比手动检查靠谱多了。

建议在实际项目中试试这些特性，特别是需要处理复杂数据结构的场景。虽然模式匹配还在预览阶段，但已经很好用了。下一篇文章咱就聊聊外部函数和内存 API，看看怎么和本地代码交互。兄弟们有啥问题随时问，鹏磊会尽量解答。
