# 08、Android设计模式 - 观察者模式
- 来源：https://ddkk.com/zhuanlan/design/android/1/8.html
- 分类：设计模式
- 分组：教程目录
观察者模式是一种使用频率非常高的设计模式，最常用的地方就是订阅-发布系统。

这个模式的重要作用就是将观察者和被观察者解耦，使他们之间的依赖更小甚至没有。

## 定义

定义对象一种一对多的依赖关系，使得每当一个对象改变状态，则所有依赖于他的对象都会得到通知并被自动更新。

## 使用场景

- 关联行为场景，这个关联是可拆分的。将观察者和被观察者封装在不同的对象中，可以各自独立的变化。
- 当一个对象改变时，有其他对象要进行相应的变化，但是他并不知道有多少个对象需要变化。
- 跨系统的消息交换长江，如消息队列，时事件总线等

## UML

- Subject : 抽象被观察者（Observeable），吧所有观察者对象的医用保存在一个集合里，每个主题都可以有任意数量的观察者，抽象被观察者提供一个接口，可以增加和删除观察者对象。
- ConcreteSubject： 具体的被观察者，将有关状态存入具体的观察者对象，在具体的被观察者内部状态发生变化时，给所有注册的观察者发送通知。
- Observer ： 抽象观察者，定义了一个更新接口，使得在得到被观察者的通知时更新自己。
- ConcreteObserver ： 具体的观察者，实现了抽象观察者锁定义的接口，用来在收到通知时更新自己。

## 简单实现

订阅模式就是个观察者模式，订阅后，被订阅的有更新就会提示你。

拿微信公众号举个例子吧.Java提供的有Observer和Observable类，可以很方便的实现观察者模式。

先定义一个订阅者，实现更新方法。

```java
public class User implements Observer {
    public String name;
    public User(String name) {
        this.name = name;
    }
    @Override
    public void update(Observable o, Object arg) {
        System.out.println("Hi "+name +",公众号更新了内容："+arg);
    }
}
```

定义一个可观察者，有变化时发布更新通知。

```java
public class Gamedaily extends Observable {
    public void postNewArticle(String content){
        //内容发生改变
        setChanged();
        //通知所有订阅者改变的内容
        notifyObservers(content);
    }
}
```

使用

```java
public class Client {
    public static void main(String[] args) {
        Gamedaily gamedaily = new Gamedaily();
        User user1 = new User("user1");
        User user2 = new User("user2");
        User user3 = new User("user3");
        //将观察者注册到可观察者的通知列表中。
        gamedaily.addObserver(user1);
        gamedaily.addObserver(user2);
        gamedaily.addObserver(user3);
        gamedaily.postNewArticle("新文章来了");
    }
}
```

输出

当公众号发布新文章的时候，所有订阅者都收到的通知，并作出相应的改变。一个公众号对应多个订阅者，并且完全没有耦合。

## Android源码中的观察者模式

通常在ListView的内容变化时，我们会调用`notifyDataSetChanged()`这个方法，然后ListView里面的数据就会进行更新。这个感觉就像是观察者模式。ListView在观察者内容，内容变化发布通知之后ListView就会更新数据。

看一下这个方法。

```java
package android.widget;
public abstract class BaseAdapter implements ListAdapter, SpinnerAdapter {
    private final DataSetObservable mDataSetObservable = new DataSetObservable();
    public void registerDataSetObserver(DataSetObserver observer) {
        mDataSetObservable.registerObserver(observer);
    }
    public void unregisterDataSetObserver(DataSetObserver observer) {
        mDataSetObservable.unregisterObserver(observer);
    }
    ......
    public void notifyDataSetChanged() {
        mDataSetObservable.notifyChanged();
    }
    ......
}
```

这段代码可以看到这应该是一个观察者模式，而且这个一个被观察者，里面提供了注册和注销观察者以及通知观察者的方法。

这些方法是通过DataSetObservable这个类调用的：

```java
package android.database;
public class DataSetObservable extends Observable<DataSetObserver> {
    public void notifyChanged() {
        synchronized(mObservers) {
            for (int i = mObservers.size() - 1; i >= 0; i--) {
                mObservers.get(i).onChanged();
            }
        }
    }
    ......
}
```

这个类继承自Observable，Observable中有一个`protected final ArrayList mObservers = new ArrayList();`,

用来保存注册的观察者。`mDataSetObservable.registerObserver(observer)`和`mDataSetObservable.unregisterObserver(observer)`分别就是增加和删除。

在`notifyChanged`方法中，循环这个集合，调用每一个观察者的`onChanged()`方法。

那么这些观察者是什么时候注册的呢？也就是ListView和Adapter什么时候成了订阅关系。在ListView的`setAdapter()`中

```java
public class ListView extends AbsListView {
    public void setAdapter(ListAdapter adapter) {
        //如果已经有了一个adapter，注销这个adapter之前的观察者，
        if (mAdapter != null && mDataSetObserver != null) {
            mAdapter.unregisterDataSetObserver(mDataSetObserver);
        }
       ......
       if (mHeaderViewInfos.size() > 0|| mFooterViewInfos.size() > 0) {
            mAdapter = wrapHeaderListAdapterInternal(mHeaderViewInfos, mFooterViewInfos, adapter);
        } else {
            //将新的adapter赋给mAdapter
            mAdapter = adapter;
        }
        ......
        super.setAdapter(adapter);
        if (mAdapter != null) {
            mAreAllItemsSelectable = mAdapter.areAllItemsEnabled();
            //保存之前的数据个数
            mOldItemCount = mItemCount;
            //获取新的个数
            mItemCount = mAdapter.getCount();
            checkFocus();
            //创建数据集观察者
            mDataSetObserver = new AdapterDataSetObserver();
            //注册观察者
            mAdapter.registerDataSetObserver(mDataSetObserver);
            ...
            }
        } else {
            ...
        }
        requestLayout();
    }
}
```

AdapterDataSetObserver是ListView的父类AbsListView的内部类

```java
package android.widget;
public abstract class AbsListView extends AdapterView<ListAdapter> implements TextWatcher,
        ViewTreeObserver.OnGlobalLayoutListener, Filter.FilterListener,
        ViewTreeObserver.OnTouchModeChangeListener,
        RemoteViewsAdapter.RemoteAdapterConnectionCallback {
       class AdapterDataSetObserver extends AdapterView<ListAdapter>.AdapterDataSetObserver {
        @Override
        public void onChanged() {
            super.onChanged();
            if (mFastScroll != null) {
                mFastScroll.onSectionsChanged();
            }
        }
        ······
    }
}
```

AdapterDataSetObserver是AdapterView.AdapterDataSetObserver的子类，所以要看`super.onChanged()`

```java
package android.widget;
public abstract class AdapterView<T extends Adapter> extends ViewGroup {
    class AdapterDataSetObserver extends DataSetObserver {
        private Parcelable mInstanceState = null;
        @Override
        public void onChanged() {
            mDataChanged = true;
            mOldItemCount = mItemCount;
            mItemCount = getAdapter().getCount();
            // Detect the case where a cursor that was previously invalidated has
            // been repopulated with new data.
            if (AdapterView.this.getAdapter().hasStableIds() && mInstanceState != null
                    && mOldItemCount == 0 && mItemCount > 0) {
                AdapterView.this.onRestoreInstanceState(mInstanceState);
                mInstanceState = null;
            } else {
                rememberSyncState();
            }
            checkFocus();
            //重新布局
            requestLayout();
        }
        ......
    }
}
```

整理一下：当ListView数据变化时，调用Adapter的notifyDataSetChange方法，这个方法调用DataSetObservable的notifyChanged方法，这个方法又会调用所有观察者的onChanged方法，onChanged再调用重新布局View的方法，完成刷新数据的功能。

## 总结

### 优点

- 解除了观察者和被观察者的耦合，而且依赖的都是抽象，容易应对业务变化，各自的变化都不会影响另一个。
- 增强系统灵活性、可拓展性。

### 缺点

- Java中的消息默认是顺序执行，如果一个观察者卡顿，会造成整个系统效率变低，可以考虑异步。
- 可能会引起无用的操作甚至错误的操作。
