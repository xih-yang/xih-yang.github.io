# 11、HTML5 新的 Input 类型
- 来源：https://ddkk.com/zhuanlan/qianduan/html5/11.html
- 分类：前端框架
- 分组：教程目录
HTML5 新增加了多个表单输入类型，这些新特性提供了更好的输入控制和验证

下面列出了 HTML5 新增加的输入类型

**1、** color；

**2、** date；

**3、** datetime；

**4、** datetime-local；

**5、** email；

**6、** month；

**7、** number；

**8、** range；

**9、** search；

**10、** tel；

**11、** time；

**12、** url；

**13、** week；

> 虽然并不是所有的主流浏览器都支持新的 input 类型
>
> 但我们已经可以在所有主流的浏览器中使用它们了
>
> 因为即使不被支持，仍然可以显示为常规的文本域

##

`` 用于选取颜色

浏览器支持情况

这个范例从拾色器中选择一个颜色

```html
<label>选择你喜欢的颜色: <input type="color" name="favcolor"></label>
```

##

`` 用于从一个日期选择器选择一个日期

浏览器支持情况

下面的范例定义一个时间控制器

```html
<label>生日: <input type="date" name="bday"></label>
```

##

`` 用于创建一个选择一个日期（UTC 时间）的输入域

浏览器支持情况

定义一个日期和时间控制器（本地时间）

```html
<label>生日 (日期和时间): <input type="datetime" name="bdaytime"></label>
```

##

`` 用于创建一个选择一个日期和时间 (无时区)的输入域

浏览器支持情况

下面的范例定义一个日期和时间 (无时区)输入域

```html
<label>生日 (日期和时间): <input type="datetime-local" name="bdaytime"></label>
```

##

`` 用于创建一个 e-mail 地址的输入域

> iPhone 中的 Safari 浏览器支持 email 输入类型，并通过改变触摸屏键盘来配合它（添加 @ 和 .com 选项）

浏览器支持情况

下面的范例在提交表单时，会自动验证 email 域的值是否合法有效

```html
<label>E-mail: <input type="email" name="email"></label>
```

##

`` 用来创建一个选择月份的输入框

浏览器支持情况

下面的代码创建了一个月与年输入框 (无时区):

```html
<label>生日 (月和年): <input type="month" name="bdaymonth"></label>
```

##

`` 用于应该包含数值的输入域

我们还可以对所接受的数字进行限定

浏览器支持情况

下面的代码定义一个数值输入域(限定):

```html
<label>数量 ( 1 到 5 之间 ): <input type="number" name="quantity" min="1" 
    max="5"></label>
```

可以使用下面的属性来设置对数字类型的限定

属性
描述

disabled
规定输入字段是禁用的

max
规定允许的最大值

maxlength
规定输入字段的最大字符长度

min
规定允许的最小值

pattern
规定用于验证输入字段的模式

readonly
规定输入字段的值无法修改

required
规定输入字段的值是必需的

size
规定输入字段中的可见字符数

step
规定输入字段的的合法数字间隔

value
规定输入字段的默认值

你可以尝试一下带有所有限定属性的范例

##

`` 用于应该包含一定范围内数字值的输入域

range 类型显示为滑动条

浏览器支持情况

下面的范例定义了一个不需要非常精确的数值（类似于滑块控制）

```html
<input type="range" name="points" min="1" max="10">
```

可以使用下面的属性设置对数字类型的限定

属性
描述

max
规定允许的最大值

min
规定允许的最小值

step
规定合法的数字间隔

value
规定默认值

##

`` 用于创建一个搜索框，比如站点搜索或 Google 搜索

浏览器支持情况

下面的代码定义了一个搜索字段 (类似站点搜索或者Google搜索)

```html
<label>Search Google: <input type="search" name="googlesearch"></label>
```

##

`` 用于创建一个电话号码输入框

浏览器支持情况

下面的代码定义输入电话号码字段

```html
<label>电话号码: <input type="tel" name="usrtel"></label>
```

##

`` 用于选择一个时间

浏览器支持情况

下面的范例定义了可输入时间控制器（无时区）

```html
<label>选择时间: <input type="time" name="usr_time"></label>
```

##

`` 用于应该包含 URL 地址的输入域

> iPhone 中的 Safari 浏览器支持 url 输入类型，并可以改变触摸屏键盘来配合它（添加 .com 选项）

在提交表单时，会自动验证 url 域的值

浏览器支持情况

下面的范例定义了输入 URL 的字段

```html
<label>添加您的主页: <input type="url" name="homepage"></label>
```

##

`` 用于选择周和年

浏览器支持情况

下面的代码用于选择周和年 (无时区)

```html
<label>选择周: <input type="week" name="week_year"></label>
```

## HTML5  标签

标签
描述

](/l/penglei/htmltag/html-tag-input.html)
描述 input 输入器
