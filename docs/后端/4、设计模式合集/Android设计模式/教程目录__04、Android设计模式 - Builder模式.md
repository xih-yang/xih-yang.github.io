# 04、Android设计模式 - Builder模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/4.html
- 分类：设计模式
- 分组：教程目录
Builder模式是一步一步创建复杂对象的创建型模式。允许用户在不知道内部构建细节的情况下，可以更精细的控制构造流程。该模式是为了将构建过程和表示分开，使构建过程和部件都可以自由扩展，两者的耦合度也降到最低。

## 定义

将一个复杂对象的构建与它的表示分离，使得同样的构建过程可以创建不同的表示。

## 使用场景

- 相同的方法，不同的执行顺序，产生不同的结果。
- 多个部件或零件都可以装配到一个对象中，但产生的运行结果又不相同时。
- 产品类非常复杂，或者构建部件的顺序不同产生了不同的作用。
- 当初始化一个对象特别复杂时，如参数特别多且很多参数都有默认值的时

## UML类图

**角色介绍：**

-Product 产品的抽象类

-Builder 抽象的Builder类，规范产品的组建，一般由子类实现具体的构建过程

-ConcreteBuilder 具体的Builder类

-Director 统一组装类，导演类

## 简单实现

书中以计算机举了个例子

- 先创建计算机的抽象类

```java
public abstract class Computer {
    /**
     * 主板
     */
    protected String mBoard;
    /**
     * 显示器
     */
    protected String mDisplay;
    /**
     * 系统
     */
    protected String mOS;
    protected Computer() {
    }
    public void setmBoard(String mBoard) {
        this.mBoard = mBoard;
    }
    public void setmDisplay(String mDisplay) {
        this.mDisplay = mDisplay;
    }
    public abstract void setmOS();
    @Override
    public String toString() {
        return "Computer{" +
                "mBoard='" + mBoard + '\'' +
                ", mDisplay='" + mDisplay + '\'' +
                ", mOS='" + mOS + '\'' +
                '}';
    }
}
```

- 创建计算机的一个实现类 苹果计算机

```java
public class Macbook extends Computer {
    public Macbook() {
    }
    @Override
    public void setmOS() {
        mOS="macOS";
    }
}
```

- 创建builder的抽象类，规范产品的组建

```java
public abstract class Builder {
    public abstract Builder buildBoard(String board);
    public abstract Builder buildDisplay(String display);
    public abstract Builder buildOS();
    public abstract Computer create();
}
```

- 创建具体的Builder类，实现苹果计算机的组装

```java
public class MacbookBuilder extends Builder {
    private Computer mComputer = new Macbook();
//这里的方法返回builder本身，可以链式调用
    @Override
    public Builder buildBoard(String board) {
        mComputer.setmBoard(board);
        return this;
    }
    @Override
    public Builder buildDisplay(String display) {
        mComputer.setmDisplay(display);
        return this;
    }
    @Override
    public Builder buildOS() {
        mComputer.setmOS();
        return this;
    }
```

//调用这个方法生成最终的产品

```java
    @Override
    public Computer create() {
        return mComputer;
    }
}
```

- 导演类

```java
public class Director {
    Builder mBuilder = null;
    public Director(Builder mBuilder) {
        this.mBuilder = mBuilder;
    }
//使用导演类的话只要传参数就行，然后用传入的builder创建产品。
    public void construct(String board,String display){
        mBuilder.buildBoard(board);
        mBuilder.buildDisplay(display);
        mBuilder.buildOS();
    }
}
```

-使用示例

```java
public class MainM {
    public static void main(String[] args) {
        Builder builder = new MacbookBuilder();
//不适用导演类直接创建,通常都用这样的方式
        Computer computer =builder.buildBoard("huashuo")
                .buildOS()
                .buildDisplay("sanxing")
                .create();
        System.out.println(computer.toString());
//使用导演类创建
        Director director = new Director(builder);
        director.construct("weixing","dell");
        Computer computer1 = builder.create();
        System.out.println(computer1);
    }
}
```

-打印结果

```java
Computer{mBoard='huashuo', mDisplay='sanxing', mOS='macOS'}
Computer{mBoard='weixing', mDisplay='dell', mOS='macOS'}
```

## Android源码中的Builder模式实现

我们在构建对话框的时候通常都是以下的用法：

```java
private void showDialog(final Context context) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setIcon(R.mipmap.ic_launcher)
                .setTitle("标题")
                .setMessage("哈哈哈的信息")
                .setPositiveButton("按钮1", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Toast.makeText(context,"点了按钮1",Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("按钮2", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Toast.makeText(context,"点了按钮2",Toast.LENGTH_SHORT).show();
                    }
                })
                .setNeutralButton("按钮3", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        Toast.makeText(context,"点了按钮3",Toast.LENGTH_SHORT).show();
                    }
                });
        AlertDialog alertDialog = builder.create();
        alertDialog.show();
    }
```

可以看出AlertDialog就是通过AlertDialog.Builder来构建的。

### AlertDialog源码：

看着源码来分析

##### 创建AlertDialog

```java
public class AlertDialog extends Dialog implements DialogInterface {
    //留意这个变量
    private AlertController mAlert;
    //不公开构造方法，外部无法直接实例化
    protected AlertDialog(Context context) {
        this(context, 0);
    }
    //......省略
    AlertDialog(Context context, @StyleRes int themeResId, boolean createContextThemeWrapper) {
        super(context, createContextThemeWrapper ? resolveDialogTheme(context, themeResId) : 0,
                createContextThemeWrapper);
        mWindow.alwaysReadCloseOnTouchAttr();
        //初始化mAlert
        mAlert = AlertController.create(getContext(), this, getWindow());
    }
    @Override
    public void setTitle(CharSequence title) {
        super.setTitle(title);
        mAlert.setTitle(title);
    }
    public void setCustomTitle(View customTitleView) {
        mAlert.setCustomTitle(customTitleView);
    }
    //......省略很多这样的代码
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mAlert.installContent();
    }
//......省略代码
    //这个是AlertDialog的内部类 AlertDialog.Builder
    public static class Builder {
        //这里面有一个AlertController.AlertParams， P
        private final AlertController.AlertParams P;
        public Builder(Context context, int themeResId) {
            P = new AlertController.AlertParams(new ContextThemeWrapper(
                context, resolveDialogTheme(context, themeResId)));
         }
//......省略代码
        public Context getContext() {
            return P.mContext;
        }
        public Builder setTitle(@StringRes int titleId) {
            P.mTitle = P.mContext.getText(titleId);
            return this;
        }
//......省略很多这样的代码
        public AlertDialog create() {
            // 这里创建了一个AlertDialog
            final AlertDialog dialog = new AlertDialog(P.mContext, 0, false);
            //通过这个方法，把P中的变量传给AlertDialog的mAlert。
            P.apply(dialog.mAlert);
            dialog.setCancelable(P.mCancelable);
            if (P.mCancelable) {
                dialog.setCanceledOnTouchOutside(true);
            }
            dialog.setOnCancelListener(P.mOnCancelListener);
            dialog.setOnDismissListener(P.mOnDismissListener);
            if (P.mOnKeyListener != null) {
                dialog.setOnKeyListener(P.mOnKeyListener);
            }
            return dialog;
        }
        //显示Dialog
        public AlertDialog show() {
            final AlertDialog dialog = create();
            dialog.show();
            return dialog;
        }
    }
}
```

在源码中可以看出，我们通过builder的各种setxxx方法设置一些属性的时候，builder吧这些设置都存在一个变量P中，这个P在Builder创建时在构造方法中初始化，类型是AlertController.AlertParams，是AlertController的内部类。

然后在Builder的create方法中，new一个新的AlertDialog，并在AlertDialog的构造方法中初始化了AlertDialog的变量mAlert，类型是AlertController。

调用P.apply(mAlert)方法把P中保存的参数传递给AlertDialog的变量mAlert。最后返回这个生成的AlertDialog。

看一下这个方法：

```java
package com.android.internal.app;
public class AlertController {
    public static class AlertParams {
        public void apply(AlertController dialog) {
//基本上所有的方法都是把自己的参数设置给传进来的dialog。
            if (mCustomTitleView != null) {
                dialog.setCustomTitle(mCustomTitleView);
            } else {
                if (mTitle != null) {
                    dialog.setTitle(mTitle);
                }
               ......
            }
            if (mMessage != null) {
                dialog.setMessage(mMessage);
            }
            ......
        }
    }
}
```

##### 显示AlertDialog

在上面的使用例子中可以看出，获取到Dialog后，直接调用alertDialog.show()就能显示AlertDialog了。

```java
package android.app;
public class Dialog implements DialogInterface, Window.Callback,
        KeyEvent.Callback, OnCreateContextMenuListener, Window.OnWindowDismissedCallback {
    public void show() {
//如果已经显示，就直接return
        if (mShowing) {
            if (mDecor != null) {
                if (mWindow.hasFeature(Window.FEATURE_ACTION_BAR)) {
                  mWindow.invalidatePanelMenu(Window.FEATURE_ACTION_BAR);
                }
                mDecor.setVisibility(View.VISIBLE);
            }
            return;
        }
        mCanceled = false;
//如果没有创建，就执行Dialog的onCreate方法
        if (!mCreated) {
            dispatchOnCreate(null);
        } else {
            // Fill the DecorView in on any configuration changes that
            // may have occured while it was removed from the WindowManager.
            final Configuration config = mContext.getResources().getConfiguration();
            mWindow.getDecorView().dispatchConfigurationChanged(config);
        }
        onStart();
//获取DecorView
        mDecor = mWindow.getDecorView();
        ......
//获取布局参数
        WindowManager.LayoutParams l = mWindow.getAttributes();
        if ((l.softInputMode
                & WindowManager.LayoutParams.SOFT_INPUT_IS_FORWARD_NAVIGATION) == 0) {
            WindowManager.LayoutParams nl = new WindowManager.LayoutParams();
            nl.copyFrom(l);
            nl.softInputMode |=     WindowManager.LayoutParams.SOFT_INPUT_IS_FORWARD_NAVIGATION;
            l = nl;
        }
//将DecorView和布局参数添加到WindowManager中
        mWindowManager.addView(mDecor, l);
        mShowing = true;
//向Handler发送一个Dialog的消息，从而显示AlertDialog
        sendShowMessage();
    }
}
```

简单分析一下这个方法的主要流程就是：

（1）先确认AlertDialog的onCreate方法是否执行，如果没有执行就调用dispatchOnCreate(null)方法来调用AlertDialog的onCreate方法。

（2）调用Dialog的onStart()方法。

（3）将设置好的DecorView添加到WindowManager中。

在AlertDialog的onCreate方法中只有两行代码：

```java
@Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        mAlert.installContent();
    }
```

mAlert就是AlertDialog的AlertController类型的变量。

```java
package com.android.internal.app;
public class AlertController {
     public void installContent() {
//获取相应的对话框内容的布局
        int contentView = selectContentView();
//将布局调用Window.setContentView设置布局。
        mWindow.setContentView(contentView);
        setupView();
    }
}
```

分析LayoutInflater时就知道，Activity的setContentView最后也是调用了Window.setContentView这个方法。所以这个方法里主要就是给对话框设置布局。

```java
private int selectContentView() {
        if (mButtonPanelSideLayout == 0) {
            return mAlertDialogLayout;
        }
        if (mButtonPanelLayoutHint == AlertDialog.LAYOUT_HINT_SIDE) {
            return mButtonPanelSideLayout;
        }
        // TODO: use layout hint side for long messages/lists
        return mAlertDialogLayout;
    }
```

看到通过selectContentView()获得的布局是mAlertDialogLayout，那么这个布局是什么时候初始化的呢？

在AlertController的构造方法中可以看见：

```java
    protected AlertController(Context context, DialogInterface di, Window window) {
        mContext = context;
        mDialogInterface = di;
        mWindow = window;
        mHandler = new ButtonHandler(di);
        final TypedArray a = context.obtainStyledAttributes(null,
                R.styleable.AlertDialog, R.attr.alertDialogStyle, 0);
//这里可以看处mAlertDialogLayout的布局文件是R.layout.alert_dialog文件。
        mAlertDialogLayout = a.getResourceId(
                R.styleable.AlertDialog_layout, R.layout.alert_dialog);
       ......
        mShowTitle = a.getBoolean(R.styleable.AlertDialog_showTitle, true);
        a.recycle();
        /* 因为用自定义的标题栏，所以要隐藏DecorView的Title布局 */
        window.requestFeature(Window.FEATURE_NO_TITLE);
    }
```

好，来看一下布局文件，也就是alert_dialog.xml

默认的布局是这样的，本来文件中是空白的，为了能看出来，我给布局设置了一些值和背景色：

源代码贴出来，可以自己试试：

```java
alert_dialog.xml
<LinearLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/parentPanel"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:orientation="vertical"
    android:paddingTop="9dip"
    android:paddingBottom="3dip"
    android:paddingStart="3dip"
    android:paddingEnd="1dip">
    <LinearLayout android:id="@+id/topPanel"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:minHeight="54dip"
        android:orientation="vertical">
        <LinearLayout android:id="@+id/title_template"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:gravity="center_vertical"
            android:layout_marginTop="6dip"
            android:layout_marginBottom="9dip"
            android:layout_marginStart="10dip"
            android:layout_marginEnd="10dip">
            <ImageView android:id="@+id/icon"
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:layout_gravity="top"
                android:paddingTop="6dip"
                android:paddingEnd="10dip"
                android:src="@drawable/ic_dialog_info" />
            <com.android.internal.widget.DialogTitle android:id="@+id/alertTitle"
                style="?android:attr/textAppearanceLarge"
                android:singleLine="true"
                android:ellipsize="end"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:textAlignment="viewStart" />
        </LinearLayout>
        <ImageView android:id="@+id/titleDivider"
            android:layout_width="match_parent"
            android:layout_height="1dip"
            android:visibility="gone"
            android:scaleType="fitXY"
            android:gravity="fill_horizontal"
            android:src="@android:drawable/divider_horizontal_dark" />
        <!-- If the client uses a customTitle, it will be added here. -->
    </LinearLayout>
    <LinearLayout android:id="@+id/contentPanel"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_weight="1"
        android:orientation="vertical">
        <ScrollView android:id="@+id/scrollView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:paddingTop="2dip"
            android:paddingBottom="12dip"
            android:paddingStart="14dip"
            android:paddingEnd="10dip"
            android:overScrollMode="ifContentScrolls">
            <TextView android:id="@+id/message"
                style="?android:attr/textAppearanceMedium"
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:padding="5dip" />
        </ScrollView>
    </LinearLayout>
    <FrameLayout android:id="@+id/customPanel"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:layout_weight="1">
        <FrameLayout android:id="@+android:id/custom"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:paddingTop="5dip"
            android:paddingBottom="5dip" />
    </FrameLayout>
    <LinearLayout android:id="@+id/buttonPanel"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:minHeight="54dip"
        android:orientation="vertical" >
        <LinearLayout
            style="?android:attr/buttonBarStyle"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:orientation="horizontal"
            android:paddingTop="4dip"
            android:paddingStart="2dip"
            android:paddingEnd="2dip"
            android:measureWithLargestChild="true">
            <LinearLayout android:id="@+id/leftSpacer"
                android:layout_weight="0.25"
                android:layout_width="0dip"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:visibility="gone" />
            <Button android:id="@+id/button1"
                android:layout_width="0dip"
                android:layout_gravity="start"
                android:layout_weight="1"
                style="?android:attr/buttonBarButtonStyle"
                android:maxLines="2"
                android:layout_height="wrap_content" />
            <Button android:id="@+id/button3"
                android:layout_width="0dip"
                android:layout_gravity="center_horizontal"
                android:layout_weight="1"
                style="?android:attr/buttonBarButtonStyle"
                android:maxLines="2"
                android:layout_height="wrap_content" />
            <Button android:id="@+id/button2"
                android:layout_width="0dip"
                android:layout_gravity="end"
                android:layout_weight="1"
                style="?android:attr/buttonBarButtonStyle"
                android:maxLines="2"
                android:layout_height="wrap_content" />
            <LinearLayout android:id="@+id/rightSpacer"
                android:layout_width="0dip"
                android:layout_weight="0.25"
                android:layout_height="wrap_content"
                android:orientation="horizontal"
                android:visibility="gone" />
        </LinearLayout>
     </LinearLayout>
</LinearLayout>
```

回到AlertController的installContent()方法中，看下一行代码`setupView();`

```java
private void setupView() {
//获取alert_dialog.xml中的布局
        final View parentPanel = mWindow.findViewById(R.id.parentPanel);
        final View defaultTopPanel = parentPanel.findViewById(R.id.topPanel);
       ......
        // 这里看有没有设置自定义布局
        final ViewGroup customPanel = (ViewGroup) parentPanel.findViewById(R.id.customPanel);
        setupCustomContent(customPanel);
........
//根据传入的参数来设置布局里面的View的显示或隐藏
        if (!hasButtonPanel) {
            if (contentPanel != null) {
                final View spacer = contentPanel.findViewById(R.id.textSpacerNoButtons);
                if (spacer != null) {
                    spacer.setVisibility(View.VISIBLE);
                }
            }
            mWindow.setCloseOnTouchOutsideIfNotSet(true);
        }
.........
        final TypedArray a = mContext.obtainStyledAttributes(
                null, R.styleable.AlertDialog, R.attr.alertDialogStyle, 0);
//所有的布局设置为背景
        setBackground(a, topPanel, contentPanel, customPanel, buttonPanel,
                hasTopPanel, hasCustomPanel, hasButtonPanel);
        a.recycle();
    }
```

所以setupView的流程就是：

（1）初始化AlertDialog布局中的各个部分

（2）布局全部设置完毕后，又通过Window对象关联到DecorView。并将DecorView添加到用户窗口上显示出来。

## 总结

### 优点

- 良好的封装性，使用Builder模式可以使客户端不必知道产品的内部组成的细节
- builder独立，容易扩展

### 缺点

- 会产生多余的Builder对象以及Director对象（用的不多），消耗内存
