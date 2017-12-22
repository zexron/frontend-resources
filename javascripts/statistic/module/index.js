/**
 * Author: xuning
 * Date: 2017-9-25.
 *
 * StatisticManager：对外暴露一个已封装的Statistic初始化接口，并初始化三种Manager
 */
import Statistic from './statistic'
import Manager from './statistic-manager'

const StatisticManager = {
  timepoint: new Manager('timepoint'),
  duration: new Manager('duration'),
  exam: new Manager('exam'),
  init: function (settings) {
    if (Statistic.initialized) {
      console.error('Initial Statistic Twice!')
      return
    }
    Statistic.init(settings)
    Statistic.update()
  }
}

export default StatisticManager
