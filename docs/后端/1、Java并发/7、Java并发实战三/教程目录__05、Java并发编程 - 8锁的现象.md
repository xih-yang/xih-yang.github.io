# 05、Java并发编程 - 8锁的现象
- 来源：https://ddkk.com/zhuanlan/java/concurrency/7/5.html
- 分类：Java并发
- 分组：教程目录
## 5、8锁的现象

以下名词解释：

顺序执行：先调用的先执行；

随机执行：没有规律，与计算机硬件资源有关，哪个线程先得到资源就先执行，各个线程之间互不干扰。

### 5.1. 多个线程使用同一把锁-顺序执行

1、多个线程使用同一个对象，多个线程就是使用一把锁，先调用的先执行！

**示例1、标准访问，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseOneLock01 {
    public static void main(String[] args){
        Mobile mobile = new Mobile();
        // 两个线程使用的是同一个对象。两个线程是一把锁！先调用的先执行！
        new Thread(()-mobile.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile {
    // 被 synchronized 修饰的方法、锁的对象是方法的调用者、
    public synchronized void sendEmail() {
        System.out.println("sendEmail");
    }
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.2. 多个线程使用同一把锁，其中某个线程里面还有阻塞-顺序先执行

2、多个线程使用同一个对象，多个线程就是使用一把锁，先调用的先执行,即使在某方法中设置了阻塞。

**示例2、邮件方法暂停4秒钟，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseOneLock02 {
    public static void main(String[] args){
        Mobile2 mobile = new Mobile2();
        // 两个线程使用的是同一个对象。两个线程是一把锁！先调用的先执行！
        new Thread(()-mobile.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile2 {
    // 被 synchronized 修饰的方法、锁的对象是方法的调用者、
    public synchronized void sendEmail() {
        //多个线程使用一把锁，这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.3. 多个线程有锁与没锁-随机执行

多个线程，有的线程有锁，有的线程没锁，两者之间不存在竞争同一把锁的情况，先后执行顺序是随机的。

这种情况犹如你跟你老婆下班回家，家里面的厕所是有锁的，卧室没有锁，俩人到家后，你老婆先上厕所（有锁），你可以一直等待你老婆出来，你再去厕所后，才进卧室，你也可以先进卧室，等你老婆出来后，你再进厕所。

**示例3、新增一个普通方法接收微信()没有同步,请问先打印邮件还是接收微信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadHaveLockAndNot03 {
    public static void main(String[] args){
        Mobile3 mobile = new Mobile3();
        // 两个线程使用的是同一个对象。两个线程是一把锁！先调用的先执行！
        new Thread(()-mobile.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile.sendMS(),"B").start();
        new Thread(()-mobile.getWeixinMs(),"C").start();
    }
}
// 手机，发短信，发邮件
class Mobile3 {
    // 被 synchronized 修饰的方法、锁的对象是方法的调用者、
    public synchronized void sendEmail() {
        //多个线程使用一把锁，这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
    //接收微信，没有锁
    public void getWeixinMs() {
        System.out.println("getWeixinMs");
    }
}
```

### 5.4. 多个线程使用多把锁-随机执行

1、被 synchronized 修饰的方法，锁的对象是方法的调用者；

2、调用者不同，它们之间用的不是同一个锁，相互之间没有关系。

**示例4、两部手机、请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseMultiLock04 {
    public static void main(String[] args){
        // 两个对象，互不干预
        Mobile4 mobile1 = new Mobile4();
        Mobile4 mobile2 = new Mobile4();
        new Thread(()-mobile1.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile2.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile4 {
    /**
     *  @description:
     *  被 synchronized 修饰的方法，锁的对象是方法的调用者；
     *  调用者不同，它们之间用的不是同一个锁，相互之间没有关系。
     */
    public synchronized void sendEmail() {
        //这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.5. Class锁：多个线程使用一个对象-顺序执行

被synchronized 和 static 同时修饰的方法，锁的对象是类的 class 对象，是唯一的一把锁。线程之间是顺序执行。

锁Class和锁对象的区别：

1、Class 锁 ，类模版，只有一个；

2、对象锁 ， 通过类模板可以new 多个对象。

如果全部都锁了Class，那么这个类下的所有对象都具有同一把锁。

**示例5、两个静态同步方法，同一部手机，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseOneObjectOneClassLock05 {
    public static void main(String[] args){
        Mobile5 mobile = new Mobile5();
        new Thread(()-mobile.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile5 {
    /**
     *  @description:
     *锁Class和锁对象的区别：
     * 1、锁 Class，类模版，只有一个;
     * 2、锁  对象，通过 类模板可以new 多个对象.
     * 如果全部都锁了Class，那么这个类下的所有对象都具有同一把锁。
     *被 synchronized 修饰 和 static 修饰的方法，锁的对象是类的 class 对象，是唯一的一把锁。线程之间是顺序执行。
     */
    public synchronized static void sendEmail() {
        //这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    public synchronized static void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.6. Class锁：多个线程使用多个对象-顺序执行

被synchronized 修饰 和 static 修饰的方法，锁的对象是类的 class 对象，是唯一的一把锁。

Class锁是唯一的，所以多个对象使用的也是同一个Class锁。

**示例6、两个静态同步方法，2部手机，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseMultiObjectOneClassLock06 {
    public static void main(String[] args){
        Mobile6 mobile1 = new Mobile6();
        Mobile6 mobile2 = new Mobile6();
        new Thread(()-mobile1.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile2.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile6 {
    /**
     *  @description:
     *锁Class和锁对象的区别：
     * 1、锁 Class，类模版，只有一个;
     * 2、锁  对象，通过 类模板可以new 多个对象.
     * 如果全部都锁了Class，那么这个类下的所有对象都具有同一把锁。
     * 被 synchronized和static修饰的方法，锁的对象是类的class对象！唯一的同一把锁
     */
    public synchronized static void sendEmail() {
        //这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    public synchronized static void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.7. Class锁与对象锁：多个线程使用一个对象-随机执行

被synchronized和static修饰的方法，锁的对象是类的class对象！唯一的同一把锁；

只被synchronized修饰的方法，是普通锁（如对象锁），不是Class锁，所以进程之间执行顺序互不干扰。

**示例7、一个普通同步方法，一个静态同步方法，同一部手机，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseOneObjectClassLockAndObjectLock07 {
    public static void main(String[] args){
        Mobile7 mobile = new Mobile7();
        new Thread(()-mobile.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile7 {
    /**
     *  @description:
     *锁Class和锁对象的区别：
     * 1、锁 Class，类模版，只有一个;
     * 2、锁  对象，通过 类模板可以new 多个对象.
     * 如果全部都锁了Class，那么这个类下的所有对象都具有同一把锁。
     * 被 synchronized和static修饰的方法，锁的对象是类的class对象！唯一的同一把锁
     */
    public synchronized static void sendEmail() {
        //这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    /**
     *  @description:
     *  普通同步锁：对象锁
     */
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
}
```

### 5.8. Class锁与对象锁：多个线程使用多个对象-随机执行

被synchronized和static修饰的方法，锁的对象是类的class对象！唯一的同一把锁；

只被synchronized修饰的方法，是普通锁（如对象锁），不是Class锁，所以进程之间执行顺序互不干扰。

**示例8、一个普通同步方法，一个静态同步方法，2部手机，请问先打印邮件还是短信？**

```java
package com.interview.concurrent.lock.locakType;
import java.util.concurrent.TimeUnit;
/**
 * @author DDKK.COM 弟弟快看，程序员编程资料站
 * @description 描述
 * @date 2023/2/22 15:57
 */
public class MultiThreadUseMultiObjectClassLockAndObjectLock08 {
    public static void main(String[] args){
        Mobile8 mobile1 = new Mobile8();
        Mobile8 mobile2 = new Mobile8();
        new Thread(()-mobile1.sendEmail(),"A").start();
        // 干扰
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        new Thread(()-mobile2.sendMS(),"B").start();
    }
}
// 手机，发短信，发邮件
class Mobile8 {
    /**
     *  @description:
     *锁Class和锁对象的区别：
     * 1、锁 Class，类模版，只有一个;
     * 2、锁  对象，通过 类模板可以new 多个对象.
     * 如果全部都锁了Class，那么这个类下的所有对象都具有同一把锁。
     * 被 synchronized和static修饰的方法，锁的对象是类的class对象！唯一的同一把锁
     */
    public synchronized static void sendEmail() {
        //这里设置一个干扰
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("sendEmail");
    }
    /**
     *  @description:
     *  普通同步锁：对象锁
     */
    public synchronized void sendMS() {
        System.out.println("sendMS");
    }
}
```

小结

**new this 本身的这个对象，调用者**

**static class 类模板，保证唯一！**

一个对象中有多个 synchronized 方法，某个时刻内只要有一个线程去访问 synchronized 方法了就会被加锁，独立公共厕所！其他线程就会阻塞！

加了一个普通方法后 ，两个对象，无关先后，一个有锁，一个没锁！情况会变化！

换成静态同步方法，情况会变化！ CLASS ，所有静态同步方法的锁唯一 ， 对象实例class 本身！
