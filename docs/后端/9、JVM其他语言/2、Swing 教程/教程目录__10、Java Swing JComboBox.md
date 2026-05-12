# 10、Java Swing JComboBox
- 来源：https://ddkk.com/zhuanlan/java/swing/10.html
- 分类：Swing 教程
- 分组：教程目录
下拉列表的特点是将多个选项折叠在一起，只显示最前面的或被选中的一个。选择时需要单击下拉列表右边的下三角按钮，这时候会弹出包含所有选项的列表。用户可以在列表中进行选择，也可以根据需要直接输入所要的选项，还可以输入选项中没有的内容。

下拉列表由 JComboBox 类实现，常用构造方法如下。

- JComboBox()：创建一个空的 JComboBox 对象。
- JComboBox(ComboBoxModel aModel)：创建一个 JComboBox，其选项取自现有的 ComboBoxModel。
- JComboBox(Object[] items)：创建包含指定数组中元素的 JComboBox。

JComboBox 类提供了多个成员方法用于操作下拉列表框中的项，如图：

JComboBox 能够响应 ItemEvent 事件和 ActionEvent 事件，其中 ItemEvent 触发的时机是当下拉列表框中的所选项更改时，ActionEvent 触发的时机是当用户在 JComboBox 上直接输入选择项并回车时。要处理这两个事件，需要创建相应的事件类并实现 ItemListener 接口和 ActionListener 接口。

**例1**

使用JFrame 组件创建一个窗口，然后使用 JComboBox 类创建一个包含4个选项的下拉列表框。具体实现代码如下：

```java
import javax.swing.JComboBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
public class JComboBoxDemo
{
    public static void main(String[] args)
    {
        JFrame frame=new JFrame("Java下拉列表组件示例");
        JPanel jp=new JPanel();    //创建面板
        JLabel label1=new JLabel("证件类型：");    //创建标签
        JComboBox cmb=new JComboBox();    //创建JComboBox
        cmb.addItem("--请选择--");    //向下拉列表中添加一项
        cmb.addItem("身份证");
        cmb.addItem("驾驶证");
        cmb.addItem("军官证");
        jp.add(label1);
        jp.add(cmb);
        frame.add(jp);
        frame.setBounds(300,200,400,100);
        frame.setVisible(true);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    }
}
```

上述代码创建了一个下拉列表组件 cmb，然后调用 addItem() 方法向下拉列表中添加 4 个选项。运行后下拉列表的效果如图

谢谢观看
