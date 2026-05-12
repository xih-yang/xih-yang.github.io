# 12、Python 教程 - 图形用户界面
- 来源：https://ddkk.com/zhuanlan/other/python/6/12.html
- 分类：Python 基础入门
- 分组：教程目录
`GUI`就是包含按钮、文本框等控件的窗口

`Tkinter`是事实上的Python标准GUI工具包

## 创建GUI示例应用程序

### 初探

导入tkinter

```java
import tkinter as tk
```

也可导入这个模块的所有内容

```java
from tkinter import *
```

要创建GUI，可创建一个将充当主窗口的顶级组件（控件）。

为此，可实例化一个Tk对象。

```java
top = Tk()
```

调用函数`mainloop`以进入Tkinter主事件循环，而不是直接退出程序。

```java
from tkinter import *
top = Tk()
mainloop()
```

效果图如下：

创建按钮，可实例化Button类。

需要使用布局管理器（也叫几何体管理器）来显示按钮的位置(使用管理器`pack`)

按钮也可以指定一些文本、给按钮添加行为

```java
from tkinter import *
button = Button()
button.pack()
button['text'] = 'Click me!'
def clicked():
    print("I was clicked!")
mainloop()
```

效果图如下：

可以不分别给属性赋值，而使用方法config同时设置多个属性。

`button.config(text='Click me!',command=clicked)`

还可使用控件的构造函数来配置控件。

`Button(text='click me too!',command=clicked).pack()`

### 布局

对控件调用方法pack时，将把控件放在其父控件（主控件）中。

```java
from tkinter import *
Label(text="I'm in the first window!").pack()
second = Toplevel()
Label(second,text="I'm in the second window!").pack()
```

效果图如下：

Toplevel类表示除主窗口外的另一个顶级窗口，而Label就是文本标签。

**一列按钮**

```java
from tkinter import *
for i in range(10):
    Button(text=i).pack()
mainloop()
```

效果图如下：

要快速了解可用的选项，可执行如下命令

```java
help(Pack.config)
'''
Help on function pack_configure in module tkinter:
pack_configure(self, cnf={}, **kw)
    Pack a widget in the parent widget. Use as options:
    after=widget - pack it after you have packed widget
    anchor=NSEW (or subset) - position widget according to
                              given direction
    before=widget - pack it before you will pack widget
    expand=bool - expand widget if parent size grows
    fill=NONE or X or Y or BOTH - fill widget if widget grows
    in=master - use master to contain this widget
    in_=master - see 'in' option description
    ipadx=amount - add internal padding in x direction
    ipady=amount - add internal padding in y direction
    padx=amount - add padding in x direction
    pady=amount - add padding in y direction
    side=TOP or BOTTOM or LEFT or RIGHT -  where to add this widget.
'''
```

还有其他的布局管理器，具体地说是**grid**和**place**

```java
help(Grid.configure)
'''
Help on function grid_configure in module tkinter:
grid_configure(self, cnf={}, **kw)
    Position a widget in the parent widget in a grid. Use as options:
    column=number - use cell identified with given column (starting with 0)
    columnspan=number - this widget will span several columns
    in=master - use master to contain this widget
    in_=master - see 'in' option description
    ipadx=amount - add internal padding in x direction
    ipady=amount - add internal padding in y direction
    padx=amount - add padding in x direction
    pady=amount - add padding in y direction
    row=number - use cell identified with given row (starting with 0)
    rowspan=number - this widget will span several rows
    sticky=NSEW - if cell is larger on which sides will this
                  widget stick to the cell boundary
'''
```

```java
help(Place.config)
'''
Help on function place_configure in module tkinter:
place_configure(self, cnf={}, **kw)
    Place a widget in the parent widget. Use as options:
    in=master - master relative to which the widget is placed
    in_=master - see 'in' option description
    x=amount - locate anchor of this widget at position x of master
    y=amount - locate anchor of this widget at position y of master
    relx=amount - locate anchor of this widget between 0.0 and 1.0
                  relative to width of master (1.0 is right edge)
    rely=amount - locate anchor of this widget between 0.0 and 1.0
                  relative to height of master (1.0 is bottom edge)
    anchor=NSEW (or subset) - position anchor according to given direction
    width=amount - width of this widget in pixel
    height=amount - height of this widget in pixel
    relwidth=amount - width of this widget between 0.0 and 1.0
                      relative to width of master (1.0 is the same width
                      as the master)
    relheight=amount - height of this widget between 0.0 and 1.0
                       relative to height of master (1.0 is the same
                       height as the master)
    bordermode="inside" or "outside" - whether to take border width of
                                       master widget into account
'''
```

### 事件处理

通过设置属性`command`给按钮指定动作（action），这是一种特殊的事件处理。

Tkinter还提供了更通用的事件处理机制：方法`bind`。要让控件对特定的事件进行处理，可对其调用方法bind，并指定事件的名称和要使用的函数。

**点哪儿显示所点击的坐标位置（鼠标单击事件，提供x和y坐标）**

其中是使用鼠标左按钮（按钮1）单击的事件名称。

将这种事件关联到函数callback。

这样，每当用户在窗口top中单击时，都将调用这个函数。向函数callback传递一个event对象，这个对象包含的属性随事件类型而异。

```java
from tkinter import *
top = Tk()
def callback(event):
    print(event.x,event.y)
top.bind('<Button-1>',callback)#结果为：'2435082162376callback'
mainloop()
```

效果图如下：

当然也可以查询帮助

```java
help(Tk.bind)
'''
Help on function bind in module tkinter:
bind(self, sequence=None, func=None, add=None)
    Bind to this widget at event SEQUENCE a call to function FUNC.
    SEQUENCE is a string of concatenated event
    patterns. An event pattern is of the form
    <MODIFIER-MODIFIER-TYPE-DETAIL> where MODIFIER is one
    of Control, Mod2, M2, Shift, Mod3, M3, Lock, Mod4, M4,
    Button1, B1, Mod5, M5 Button2, B2, Meta, M, Button3,
    B3, Alt, Button4, B4, Double, Button5, B5 Triple,
    Mod1, M1. TYPE is one of Activate, Enter, Map,
    ButtonPress, Button, Expose, Motion, ButtonRelease
    FocusIn, MouseWheel, Circulate, FocusOut, Property,
    Colormap, Gravity Reparent, Configure, KeyPress, Key,
    Unmap, Deactivate, KeyRelease Visibility, Destroy,
    Leave and DETAIL is the button number for ButtonPress,
    ButtonRelease and DETAIL is the Keysym for KeyPress and
    KeyRelease. Examples are
    <Control-Button-1> for pressing Control and mouse button 1 or
    <Alt-A> for pressing A and the Alt key (KeyPress can be omitted).
    An event pattern can also be a virtual event of the form
    <<AString>> where AString can be arbitrary. This
    event can be generated by event_generate.
    If events are concatenated they must appear shortly
    after each other.
    FUNC will be called if the event sequence occurs with an
    instance of Event as argument. If the return value of FUNC is
    "break" no further bound function is invoked.
    An additional boolean parameter ADD specifies whether FUNC will
    be called additionally to the other bound function or whether
    it will replace the previous function.
    Bind will return an identifier to allow deletion of the bound function with
    unbind without memory leak.
    If FUNC or SEQUENCE is omitted the bound function or list
    of bound events are returned.
'''
```

### 最终的程序

**简单的GUI文本编辑器**

1，需要输入所要编辑的文本地址

2，点击Open，即可打开该文本文件

3，在下方编辑栏中可随意编辑

4，点击Save即可保存

```java
from tkinter import *
from tkinter.scrolledtext import ScrolledText
def load():
    with open(filename.get()) as file:
        contents.delete('1.0', END)
        contents.insert(INSERT, file.read())
def save():
    with open(filename.get(), 'w') as file:
        file.write(contents.get('1.0', END))
top = Tk() 
top.title("Simple Editor")
contents = ScrolledText() 
contents.pack(side=BOTTOM, expand=True, fill=BOTH)
filename = Entry() 
filename.pack(side=LEFT, expand=True, fill=X)
Button(text='Open', command=load).pack(side=LEFT) 
Button(text='Save', command=save).pack(side=LEFT)
mainloop()
```

效果图如下：

## 小结

概念
描述

图形用户界面（GUI）
GUI有助于让应用程序对用户更友好。并非所有的程序都需要GUI，但只要程序需要与用户交互，GUI就可能很有帮助。

Tkinter
Tkinter是一个跨平台的Python GUI工具包，成熟而且使用广泛。

布局
通过指定组件的几何属性，很容易对其进行定位，但要确保它们在父窗口的大小发生变化时做出正确的反应，就必须使用布局管理器。

事件处理
GUI工具包中用户触发事件执行的操作。要发挥作用，程序可能需要响应某些事件，否则用户将无法与之交互。在Tkinter中，要给组件添加事件处理程序，可使用方法bind。
