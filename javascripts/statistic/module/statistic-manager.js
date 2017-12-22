/**
 * Author: xuning
 * Date: 2017-9-25.
 *
 * Statistic类对应的管理器
 */
import Statistic from './statistic'

class Manager {
  /**
   * 构造函数
   * @param type <String> 可选项：timepoint, duration, exam
   */
  constructor (type) {
    this.type = type
    this.statistics = []
  }

  /**
   * 从池中获取一个名为topic的Statistic实例对象，若当前池中的对象都在使用，将新建一个对象并返回
   * @param topic <String>
   * @returns {Statistic}
   */
  getOne (topic) {
    // 若池已满，将清理未在使用的实例对象
    if (this.statistics.length >= Manager.POOL_SIZE) {
      console.warn('Statistic-Manager: Stack is Full: ' + this.statistics.length + '\nDo Clean Up')
      this.statistics = this.statistics.filter((statistic) => {
        return ((statistic.type !== 'duration' && !statistic.connecting) ||
          (statistic.type === 'duration' && !statistic.connecting && !statistic.running && statistic.ends))
      })
    }

    for (let i = 0, max = this.statistics.length; i < max; i++) {
      let statistic = this.statistics[i]
      if ((statistic.type !== 'duration' && !statistic.connecting) ||
        (statistic.type === 'duration' && !statistic.connecting && !statistic.running && statistic.ends)) {
        return statistic.setTopic(topic)
      }
    }

    let newStatistic = new Statistic({topic: topic, type: this.type})
    this.statistics.push(newStatistic)
    return newStatistic
  }

  /**
   * 在池中搜索并返回名为topic的Statistic对象，若未找到，返回null
   * 该方法一般用于同级duration更改topic时
   * @param topic
   * @returns {*}
   */
  findOne (topic) {
    for (let i = 0, max = this.statistics.length; i < max; i++) {
      let statistic = this.statistics[i]
      if (statistic.topicId === topic) {
        return statistic
      }
    }

    return null
  }
}

Manager.POOL_SIZE = 10 // 清理阈值

export default Manager
