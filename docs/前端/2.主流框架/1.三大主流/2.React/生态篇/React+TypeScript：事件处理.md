# React + TypeScript：事件处理

**目录：**

[1. onClick](#DHgLo)

[2. onChange](#uJmSZ)

[3. onScroll](#ODQwz)

[4. onSubmit](#ZDNg8)

[5. onCopy、onCut、onPaste](#bJRWI)

[6. onMouseOver、onMouseOut](#Ia1VG)

[7. onLoad、onError](#ZztJo)

[8. onkeydown、onkeypress、onkeyup](#i8o9g)

[9. onFocus、onBlur](#mek3H)

[10. onDragStart、onDrop、onDragOver](#NUgER)

[11. window.resize](#SBABF)

## 1. onClick

onClick可能是平时用的最多的事件之一了，这里主要列举两种类型的onClick事件：

* button按钮的onClick事件；
* 任意元素的的onClick事件。

下面先来看看按钮的 `onClick` 事件，当点击按钮时，在页面显示按钮的名称：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [clickedButton, setClickedButton] = useState("");

  const buttonHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const button: HTMLButtonElement = event.currentTarget;
    setClickedButton(button.name);
  };

  return (
    <div className="container">
      <form>
        <button onClick={buttonHandler} className="button" name="button 1">
          Button 1
        </button>

        <button onClick={buttonHandler} className="button" name="button 2">
          Button 2
        </button>

        <button onClick={buttonHandler} className="button" name="button 3">
          Button 3
        </button>
      </form>
      <h1>
        {clickedButton !== "" ? `点击了 ${clickedButton}` : "没有点击任何按钮"}
      </h1>
    </div>
  );
};

export default App;
```

**在线体验：**[https://codesandbox.io/s/dawn-feather-8gofq1](https://codesandbox.io/s/dawn-feather-8gofq1?file=/src/App.tsx:0-914)

***

可以看到，onClick 事件的事件处理对象的类型都定义为了 `MouseEvent`，其中传入的参数为绑定事件的元素的类型。可以通过事件对象的 `currentTarget` 属性来获取点击元素的属性。

再来看看任意元素的 onClick事件，点击一个元素时，在控制台打印点击元素的类型、长度、宽度：

```typescript
import React from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  // 当 container 被点击时，触发该事件
  const divClickedHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    const div = event.currentTarget;
    console.log(
      "ElementName: ", div.tagName,
      "Width: ", div.clientWidth,
      "Height: ", div.clientHeight
    );
  };

  // 当 h1 被点击时，触发该事件
  const headingClickedHandler = (event: React.MouseEvent<HTMLHeadingElement>) => {
    event.stopPropagation();

    const heading = event.currentTarget;
    console.log(
      "ElementName: ", heading.tagName,
      "Width: ", heading.clientWidth,
      "Height: ", heading.clientHeight
    );
  };

  // 当图片被点击时，触发该事件
  const imgClickedHandler = (event: React.MouseEvent<HTMLImageElement>) => {
    event.stopPropagation();
    
    const img = event.currentTarget;
    console.log(
      "ElementName: ", img.tagName,
      "Width: ", img.clientWidth,
      "Height: ", img.clientHeight
    );
  };

  return (
    <div className="container" onClick={divClickedHandler}>
      <h1 onClick={headingClickedHandler}>Hello World</h1>
      <img
        src="https://resource-1255585089.cos.ap-beijing.myqcloud.com/111.png"
        alt="111"
        onClick={imgClickedHandler}
      />
    </div>
  );
};

export default App;

```

可以看到，onClick 事件的事件处理对象的类型都定义为了 `MouseEvent`，其中传入的参数为绑定事件的元素的类型。需要注意，在任意元素上添加点击事件时，会触发事件冒泡，比如上面的例子，当点击是图片或者h1标签时就会导致其父元素div的点击事件触发。可以使用下面的代码来避免默认事件：

```typescript
event.stopPropagation();
```

**在线体验：**<https://codesandbox.io/s/serverless-glade-g41upi>

## 2. onChange

下面来看看 onChange 事件，先来看 `select` 元素的 `onChange` 事件的例子，当选中元素时，选中元素的值会显示在页面上：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [selectedOption, setSelectedOption] = useState<String>();

  const selectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedOption(value);
  };

  return (
    <div className="container">
      <select onChange={selectChange} className="select">
        <option selected disabled>
          选择一个
        </option>
        <option value="blue">Blue</option>
        <option value="red">Red</option>
        <option value="green">Green</option>
        <option value="yellow">Yellow</option>
      </select>
      {selectedOption && <h2 className="result">{selectedOption}</h2>}
    </div>
  );
};

export default App;
```

可以看到，`select` 元素的 `onSelect` 的事件对象类型为 `ChangeEvent`，传入的参数为 `select` 元素的类型。可以通过 `target` 属性来获取 `select`选中的值。

**在线体验：**<https://codesandbox.io/s/frosty-lichterman-33fpky>

`input` 元素的 `onChange` 事件的例子，在输入框中输入内容，点击搜索按钮，在页面显示搜索结果：

```typescript
import React, { useState } from "react";
import "./styles.css";

interface Item {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: Item[] = [
  {
    id: 1,
    name: "Apple",
    price: 1
  },
  {
    id: 2,
    name: "Book",
    price: 5
  },
  {
    id: 3,
    name: "Banana",
    price: 0.5
  },
  {
    id: 4,
    name: "Table",
    price: 200
  }
];

const App: React.FunctionComponent = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Item[] | undefined>();

  // 当 input 的内容改变时触发
  const inputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enteredName = event.target.value;
    setQuery(enteredName);
  };

  // 点击搜索时触发
  const search = () => {
    const foundItems = PRODUCTS.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setResult(foundItems);
  };

  return (
    <div className="container">
      <div className="wrapper">
        <input
          value={query}
          onChange={inputHandler}
          placeholder="输入要搜索的商品名称"
          className="input"
        />

        <button onClick={search}>搜索</button>
      </div>

      <div className="search-result">
        {result && result.length > 0 ? (
          result.map((item) => (
            <li key={item.id} className="item">
              <span className="item-id">{item.id}</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">{item.price}￥</span>
            </li>
          ))
        ) : (
          <h2>没有找到！</h2>
        )}
      </div>
    </div>
  );
};

export default App;
```

**在线体验：**[https://codesandbox.io/s/pedantic-murdock-lejmg6](https://codesandbox.io/s/pedantic-murdock-lejmg6?file=/src/App.tsx:0-1641)

可以看到，这里input 的事件处理对象的类型为 `ChangeEvent`。要想获取输入的值需要从事件对象的 target 属性中获取。

## 3. onScroll

onScroll 事件在元素的滚动条被滚动时触发\*\*。\*\*

下面来看一个例子，当元素发生滚动时，计算滚动了多少的元素，从而计算页面滚动进度的百分比值，并显示在页面上：

```javascript
import React, { useState } from "react";
import "./styles.css";

const DUMMY_DATA = Array.from({ length: 100 }, (x, i) => {
  return {
    id: i,
    title: `Item ${i}`
  };
});

const App: React.FunctionComponent = () => {
  const [progress, setProgress] = useState(0);
  
  // 当元素发生滚动时触发该事件
  const scrollHandler = (event: React.UIEvent<HTMLDivElement>) => {
    const containerHeight = event.currentTarget.clientHeight;
    const scrollHeight = event.currentTarget.scrollHeight;
    const scrollTop = event.currentTarget.scrollTop;
    setProgress(((scrollTop + containerHeight) / scrollHeight) * 100);
  };

  return (
    <>
      <div className="container" onScroll={scrollHandler}>
        <div className="list">
          {DUMMY_DATA.map((item) => (
            <div className="item" key={item.id}>
              {item.title}
            </div>
          ))}
        </div>
      </div>

      <div className="progressBar">
        <div className="progressValue" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text">{progress.toFixed(2)}%</p>
    </>
  );
};

export default App;
```

可以看到，`onScroll` 事件的事件对象类型定义为了：`React.UIEvent<HTMLDivElement>`，参数为绑定事件的元素的类型。可以通过事件对象的 `currentTarget` 属性来获取页面滚动的相关值。

**在线体验**：<https://codesandbox.io/s/competent-hellman-qh7non>

## 4. onSubmit

下面来看看表单的 `onSubmit` 事件，该事件在表单提交时触发：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [term, setTerm] = useState("");

  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    // 防止页面重新加载
    event.preventDefault();
    alert(term);
  };

  return (
    <div className="container">
      <form onSubmit={submitForm}>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          type="text"
          className="input"
        />
        <button type="submit" className="btn">
          提交
        </button>
      </form>
    </div>
  );
};

export default App;
```

表单提交事件的时间对象类型为 `FormEvent`。需要注意，为了防止页面在表单的 `onSubmit`\*\* \*\*事件触发时重新加载，需要调用：

```typescript
event.preventDefault();
```

**在线体验：**[https://codesandbox.io/s/condescending-danny-e1eerd](https://codesandbox.io/s/condescending-danny-e1eerd?file=/src/App.tsx:0-647)

## 5. onCopy、onCut、onPaste

下面来看看常见的复制、剪切、粘贴这三个时间：

* onCopy事件：在用户复制元素或元素的内容（如文本、图像）时触发；
* onPaste事件：在用户在元素中粘贴一些内容时触发；
* onCut事件：在用户剪切元素的内容时发生，此事件主要用于 input (type=”text”) 和 textarea 元素。

下面来看一个例子，当进行复制、剪切、粘贴时，给操作的元素加上一些样式：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [text, setText] = useState("hello world");

  // 复制：onCopy
  const copyHandler = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.currentTarget.style.border = "3px solid green";
  };

  // 剪切：onCut
  const cutHandler = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.currentTarget.style.border = "3px solid orange";
    event.currentTarget.style.backgroundColor = "yellow";
    event.currentTarget.disabled = true;
    setText("内容被剪切啦");
  };

  // 粘贴：onPaste
  const pasteHandler = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.currentTarget.style.border = "5px solid purple";
    event.currentTarget.style.backgroundColor = "orange";
    event.currentTarget.value = event.clipboardData.getData("text").toUpperCase();
    event.preventDefault();
  };

  return (
    <div className="container">
      <input type="text" value={text} onCopy={copyHandler} onCut={cutHandler} />
      <hr />
      <p>在下方粘贴:</p>
      <textarea onPaste={pasteHandler} className="text-area"></textarea>
    </div>
  );
};

export default App;
```

可以看到，这三个事件的事件处理对象的类型都定义为了 `ClipboardEvent`，其中传入的参数为绑定事件的元素的类型。可以通过 `currentTarget` 属性来获取事件对象的属性。

**在线体验：**<https://codesandbox.io/s/sleepy-keldysh-w5vemj>

## 6. onMouseOver、onMouseOut

`onmouseover` 和 `onmouseout` 是常用的两个鼠标事件：

* `onmouseover`：在鼠标指针移动到指定的对象上时触发；
* `onmouseout`：在鼠标指针移出指定的对象时触发。

下面来看一个例子，当鼠标在元素上和移出元素时给元素添加不同的样式：

```typescript
import React from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  // 当鼠标指针位于box上时，将触发此功能
  const boxMouseOverHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    const box: HTMLDivElement = event.currentTarget;
    box.style.backgroundColor = "lightblue";
  };

  // 当鼠标指针移出box时，将触发此功能
  const boxMouseOutHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    const box: HTMLDivElement = event.currentTarget;
    box.style.backgroundColor = "lightgreen";
  };

  // 当鼠标指针位于输入框上时，将触发此功能
  const inputMouseOverHandler = (event: React.MouseEvent<HTMLInputElement>) => {
    const input: HTMLInputElement = event.currentTarget;
    input.style.backgroundColor = "lime";
  };

  //当鼠标指针移出输入框时，将触发此功能
  const inputMouseOutHandler = (event: React.MouseEvent<HTMLInputElement>) => {
    const input: HTMLInputElement = event.currentTarget;
    input.style.backgroundColor = "white";
  };

  //当鼠标指针位于按钮上时，将触发此功能
  const buttonMouseOverHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    const btn: HTMLButtonElement = event.currentTarget;
    btn.style.border = "3px solid red";
    btn.style.backgroundColor = "orange";
  };

  // 当鼠标指针移出按钮时，将触发此功能
  const buttonMouseOutHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    const btn: HTMLButtonElement = event.currentTarget;
    btn.style.border = "none";
    btn.style.backgroundColor = "yellow";
  };

  return (
    <div
      className="box"
      onMouseOver={boxMouseOverHandler}
      onMouseOut={boxMouseOutHandler}
    >
      <input
        onMouseOver={inputMouseOverHandler}
        onMouseOut={inputMouseOutHandler}
        placeholder="hello world"
      />
      <button
        onMouseOver={buttonMouseOverHandler}
        onMouseOut={buttonMouseOutHandler}
      >
        Button
      </button>
    </div>
  );
};

export default App;
```

可以看到，这两个事件的事件处理对象的类型都定义为了 `MouseEvent`，其中传入的参数为绑定事件的元素的类型。可以通过事件对象的 `currentTarget` 来获取事件对象的属性。

**在线体验：**[https://codesandbox.io/s/nervous-cloud-5r6d6p](https://codesandbox.io/s/nervous-cloud-5r6d6p?file=/src/styles.css)

## 7. onLoad、onError

`onLoad` 和 `onError` 是页面外部资源加载相关的两个相关事件：

* `onload`：资源加载失败；
* `onerror`：资源加载出错。

下面来看一个例子， 当图片成功时给它添加类名 success，加载失败时添加类型 error，并更换为备用图片的URL：

```typescript
import React from "react";
import "./styles.css";

const IMAGE ="https://resource-1255585089.cos.ap-beijing.myqcloud.com/111.png";
const FALLBACK_IMAGE ="https://resource-1255585089.cos.ap-beijing.myqcloud.com/222.png";

const App: React.FunctionComponent = () => {
  const imageOnLoadHandler = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 图片加载成功时，打印图片的地址，并添加类名 success
    console.log(event.currentTarget.src);
    if (event.currentTarget.className !== "error") {
      event.currentTarget.className = "success";
    }
  };

  const imageOnErrorHandler = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // 图片加载失败时，加载替代的图片，并添加类名 error
    event.currentTarget.src = FALLBACK_IMAGE;
    event.currentTarget.className = "error";
  };

  return (
    <div className="container">
      <img
        src={IMAGE}
        onLoad={imageOnLoadHandler}
        onError={imageOnErrorHandler}
        alt="111"
      />
    </div>
  );
};

export default App;
```

可以看到，这两个事件的事件处理对象的类型都定义为了 `SyntheticEvent`，其中传入的第一个参数为绑定事件的元素的类型。可以通过事件对象的 `currentTarget` 属性来获取事件对象的属性。

***

**在线体验：**[https://codesandbox.io/s/determined-tamas-rjwjoq](https://codesandbox.io/s/determined-tamas-rjwjoq?file=/src/App.tsx)

## 8. onkeydown、onkeypress、onkeyup

下面来看几个常见的键盘事件：

* `onKeyDown`：在用户按下一个键盘按键时触发；
* `onKeyUp`：在键盘按键被松开时触发；
* `onKeyPress`：在键盘按键被按下并释放一个键时发生。在所有浏览器中 `onkeypress` 事件只能监听字母和数字，不能监听一些特殊按键（ALT、CTRL、SHIFT、ESC、箭头等）。监听一个用户是否按下按键请使用 `onkeydown` 事件，所有浏览器都支持 `onkeydown` 事件。

这三个事件的执行顺序如下：

1. `onkeydown`
2. `onkeypress`
3. `onkeyup`

来看一个例子，按下ESC键可以清除已经输入的文本，按下Enter键可以弹出已经输入的文本：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [enteredText, setEnteredText] = useState("");

  // onKeyDown 事件处理函数
  const keyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === "Enter") {
      alert(`输入内容："${enteredText}"`);
    }
  };

  // onKeyUp 事件处理函数
  const keyUpHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.code === "Escape") {
      const confirm = window.confirm("确定清除文本吗？");

      if (confirm) {
        setEnteredText("");
      }
    }
  };

  // onKeyPress 事件处理函数
  const keyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    //...
  };

  return (
    <div className="container">
      <input
        onKeyDown={keyDownHandler}
        onKeyUp={keyUpHandler}
        onKeyPress={keyPressHandler}
        type="text"
        className="text-input"
        value={enteredText}
        onChange={(e) => setEnteredText(e.target.value)}
      />
    </div>
  );
};

export default App;
```

这三个事件的事件对象类型都是 `KeyboardEvent`。可以通过事件对象的 `code`属性获取按下的键盘键值。

**在线体验：**[https://codesandbox.io/s/prod-sky-txwzgd](https://codesandbox.io/s/prod-sky-txwzgd?file=/src/App.tsx:0-1059)

再来看一个简单的例子，通过在键盘上按下上下左右键使得盒子在页面上移动：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);

  // onKeyDown 事件处理函数
  const keyDownHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
    console.log(event.code);
    if (event.code === "ArrowUp") {
      setTop((top) => top - 10);
    }

    if (event.code === "ArrowDown") {
      setTop((top) => top + 10);
    }

    if (event.code === "ArrowLeft") {
      setLeft((left) => left - 10);
    }

    if (event.code === "ArrowRight") {
      setLeft((left) => left + 10);
    }
  };

  return (
    <div className="container" tabIndex={0} onKeyDown={keyDownHandler}>
      <div className="box" style={{ top: top, left: left }}></div>
    </div>
  );
};

export default App;

```

**在线体验：**[https://codesandbox.io/s/hungry-meninsky-zhkbzb](https://codesandbox.io/s/hungry-meninsky-zhkbzb?file=/src/App.tsx:0-825)

## 9. onFocus、onBlur

* `onfocus`：在元素获得焦点时被触发，适用于`<input>`、`<select>` 以及`<a>`标签；
* `onblur`：在元素失去焦点时触发，常用于表单验证。

下面来看一个例子，在输入框中输入内容，输入过程中保存输入的值， 当输入完成，失去输入焦点时，对输入内容进行校验：

```typescript
import React, { useState } from "react";
import "./styles.css";

const App: React.FunctionComponent = () => {
  const [name, setName] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isBlur, setIsBlur] = useState(false);

  // 处理 input 的 onChange事件
  const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  // 处理 input 的 onFocus 事件
  const focusHandler = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocus(true);
    setIsBlur(false);
    console.log(event);
  };

  // 处理 input 的 onBlur 事件
  const blurHandler = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocus(false);
    setIsBlur(true);

    if (name.match(/^[a-z][a-z\s]*$/i)) {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
    console.log(event);
  };

  return (
    <div className="container">
      <input
        type="text"
        onFocus={focusHandler}
        onBlur={blurHandler}
        value={name}
        onChange={changeHandler}
        className="input"
        placeholder="请输入名字"
      />
      {isFocus && <span className="hint">只能输入字母和空格</span>}
      {isBlur && !isValid && <p className="error">输入格式错误</p>}
      {isBlur && isValid && <p className="success">输入正确</p>}
    </div>
  );
};

export default App;
```

这里两个事件的事件对象类型都是 `FocusEvent`，传入的参数是 `input` 元素的类型。

**在线体验：**<https://codesandbox.io/s/spring-moon-roegc5>

## 10. onDragStart、onDrop、onDragOver

拖拽操作在HTML5 是作为标准的一部分。能够使用HTML5所支持的事件和属性来实现拖拽操作。下面是三个常用的拖拽事件：

* `onDragStart`：开始拖拽时触发，事件里利用`dataTransfer`保存拖拽元素的 `class` 或 `id`。
* `onDrop`：元素放置时不断触发，事件里利用`dataTransfer`来获取所保存的数据，并进行业务处理。
* `onDragOver`：在拖拽时不断触发，在其中取消默认行为可以保证该标签可以放置拖拽元素。

```typescript
import React, { useState } from "react";
import "./styles.css";

const PHOTO_URL = "https://resource-1255585089.cos.ap-beijing.myqcloud.com/111.png";

const App: React.FunctionComponent = () => {
  const [content, setContent] = useState<string>("Drop Something Here");

  // 开始拖拽时触发改事件
  const dragStartHandler = (event: React.DragEvent<HTMLDivElement>, data: string) => {
    event.dataTransfer.setData("text", data);
  };

  // 在放置时触发该事件
  const dropHandler = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("text");
    setContent(data);
  };

  // 使得第三个盒子可以放下
  const allowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="container">
      <div
        className="box1"
        onDragStart={(event) => dragStartHandler(event, PHOTO_URL)}
        draggable={true}
      >
        <img src={PHOTO_URL} alt="111" />
      </div>

      <div
        className="box2"
        onDragStart={(event) => dragStartHandler(event, "黄色卡片")}
        draggable={true}
      ></div>

      <div className="box3" onDragOver={allowDrop} onDrop={dropHandler}>
        {content.endsWith(".png") ? (
          <img src={content} alt="" />
        ) : (
          <h2>{content}</h2>
        )}
      </div>
    </div>
  );
};

export default App;
```

可以看到，两个拖拽事件的事件对象类型都是 `DragEvent`。可以通过事件对象的 `dataTransfer` 来获取事件对象的属性。

**在线体验：**[https://codesandbox.io/s/crazy-cloud-5jejr1](https://codesandbox.io/s/crazy-cloud-5jejr1?file=/src/App.tsx:0-1382)

## 11. window.resize

在 React 中是不支持直接定义 `onResize` 事件的。可以使用浏览器原生支持的 `window.resize` 事件，当浏览器窗口发生变化时会触发改事件。

可以使用以下两种方式之一来设置事件处理函数：

```javascript
window.resize = myHandlerFunction;

window.addEventListener('resize', myHandlerFunction);
```

在 React 中，要在浏览器窗口大小发生变化时重新渲染组件，可以使用 `useState`\*\* \*\*hook 来实现：

```javascript
useEffect(() => {
  window.onresize = myHandlerFunction;
}, []);

useEffect(() => {
  window.addEventListener('resize', myHandlerFunction);
}, []);
```

下面来看一个例子，在改变浏览器窗口的大小时，页面实时显示浏览器窗口的长度和宽度，并在不同宽度时显示不同的背景色：

```javascript
import React, { useState, useEffect, FunctionComponent } from "react";
import "./styles.css";

interface Size {
  width: number;
  height: number;
}

const App: FunctionComponent = () => {
  const [size, setSize] = useState<Size>();

  const resizeHanlder = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    setSize({
      width: width,
      height: height,
    });
  };

  useEffect(() => {
    window.onresize = resizeHanlder;
  }, []);

  return (
    <div
      className="container"
      style={{
        backgroundColor:
          !size || size.width <= 500
            ? "white"
            : size && size.width <= 700
              ? "green"
              : "orange",
      }}
    >
      {size && (
        <>
          <h2>Width: {size.width}</h2>
          <h2>Height: {size.height}</h2>
        </>
      )}
    </div>
  );
};

export default App;
```

**在线体验：**[https://codesandbox.io/s/async-leaf-m62ixj](https://codesandbox.io/s/async-leaf-m62ixj?file=/src/App.tsx:0-902)


> 更新: 2025-01-24 00:47:03  
> 原文: <https://www.yuque.com/cuggz/feplus/rl7cwy>