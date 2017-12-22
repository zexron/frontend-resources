# Statistic
Tracer服务器对应统计工具

## Usage
### 初始化:
必须先初始化才可以正常使用该工具
```javascript
// 初始化参数：
// options = {
//   debugMode: false,  // 默认false，开启debug模式将在sendData时打印内容到控制台而不是发送数据
//   HOST: '/tracer',   // 服务器项目名，一般不做更改
//   userId: 0,         // 用户ID
//   ProjectName: '',   // 项目名，必填项
//   durationLength: 5000 // 可选，duration类型的发送间隔
// }
```

```javascript
// jQuery
$.fn.statistic.Constructor.init(options);

// module
import StatisticManager from './statistic';
StatisticManager.init(options);
```

### 统计类型

#### timepoint
用于记录事件发生次数，以时间戳为值（毫秒）

#### duration
用于记录事件发生时长，用类似心跳线方式定期发送时间间隔（单位：毫秒）

#### exam
用于记录测试题型，以统计平均值等，值为对应得分，可以为小数


### 方法

#### 新建实例
```javascript
// jQuery
var options = {
  topic: 'myTopic',   // topic名
  event: 'eventName'  // 在dom元素触发'eventName'事件时将发送数据（仅限timepoint和exam类型）
};
$(elem).statistic(${type}, options);

// module
StatisticManager.${type}.getOne('myTopic');
```

jQuery还可以用data-statistic方式初始化：  
html:
```html
<div id="my-statistic-elem" data-statistic-topic="myTopic" data-statistic-event="eventName"></div>
```
javascript:
```javascript
$('my-statistic-elem').statistic(${type});
```

#### setTopic
更改当前实例对象名字
```javascript
// jQuery
$(elem).statistic(${type}, 'setTopic', 'newName');

// module
StatisticManager.${type}.findOne('oldName').setTopic('newName');
```

**重要**：对于正在运行中的Duration类实例，setTopic操作相当于进行以下步骤：
- 停止当前计时器，并发送数据(end)
- 更改topic名(setTopic)
- 重新开始计时(start)

#### sendData
发送数据到服务器(timepoint/exam)
- 对于timepoint类型，data为时间戳，缺省值是当前时间
- 对于exam类型，data为得分
```javascript
// jQuery
$(elem).statistic(${type}, 'sendData', data);

// module
StatisticManager.${type}.getOne('myTopic').sendData(data);
```

#### start和end
开始/停止计时器(duration)  
duration类型将以durationLength的间隔发送数据，只需控制开始结束，无需手动sendData
```javascript
// jQuery
$(elem).statistic('duration', 'start');
$(elem).statistic('duration', 'end');

// module
StatisticManager.duration.getOne('myTopic').start();
StatisticManager.duration.findOne('myTopic').end();
```

**重要**：若dom元素需要销毁，在此之前**务必**对其进行end操作，否则计时器将继续运行并可能无法停止！

## 关于`fineOne`和`getOne`
Module型工具中，StatisticManager有两个获取实例的方法：`fineOne`和`getOne`，其区别为：
- fineOne在当前已存在的实例中查找满足topic的实例，若不存在返回null
- getOne并不进行寻找，而是在实例池中查找任意一个未在使用的实例更改其topic并返回
- 对于duration类型，如果需要停止其计时，需要用findOne查找

## 其他
- jQuery的Statistic实例对象保存在``$(elem).data(`statistic-${type}`)``中
