# 10、Java10 新特性 - Unicode语言标签扩展
- 来源：https://ddkk.com/zhuanlan/java/java10/10.html
- 分类：Java 10 新特性
- 分组：教程目录
## JEP 314 - Unicode 语言标签扩展

Java 7 引入了对BCP 47语言标签的支持。但是这个 unicode 语言环境扩展仅限于日历和数字。在 Java 10 中，java.util.Locale和相关类已更新，以实现LDML 规范中指定的其他 unicode 扩展。添加了以下扩展特性。

- cu ： 货币类型
- fw ： 一周的第一天
- rg ： 区域覆盖
- tz ： 时区

以下API 已更新。

```java
java.text.DateFormat::get*Instance
java.text.DateFormatSymbols::getInstance
java.text.DecimalFormatSymbols::getInstance
java.text.NumberFormat::get*Instance
java.time.format.DateTimeFormatter::localizedBy
java.time.format.DateTimeFormatterBuilder::getLocalizedDateTimePattern
java.time.format.DecimalStyle::of
java.time.temporal.WeekFields::of
java.util.Calendar::{getFirstDayOfWeek,getMinimalDaysInWeek}
java.util.Currency::getInstance
java.util.Locale::getDisplayName
java.util.spi.LocaleNameProvider
```
