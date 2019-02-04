import { Command } from "@adonisjs/ace";
import _ from "lodash";
import moment from "moment";
import DATE_FORMAT from "~/src/constant/date_format";

class Base extends Command {
  static get signature() {
    return `
     Parse:Base

     {--onlyFlag:[必传]flag,只有true/false两个值}
     {--logName=@value:[必传]日志文件名}
     {--isTest?=@value:[可选]是否处于测试环境}
     `;
  }

  static get description() {
    return "解析kafka日志, Base";
  }

  /**
   * 在最外层进行一次封装, 方便获得报错信息
   * @param args
   * @param options
   * @returns {Promise<void>}
   */
  async handle(args: any, options: any) {
    this.log("command start");
    await this.execute(args, options).catch(e => {
      this.log("catch error");
      this.log(e.stack);
    });
    this.log("command finish");
  }

  /**
   *
   * @param args
   * @param options
   */
  async execute(args: any, options: any): Promise<any> {

  }

  /**
   * 简易logger
   * @returns  null
   */
  async log(...argumentList: string[] | any): Promise<any> {
    let message = "";
    for (const rawMessage of argumentList) {
      if (_.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage);
      } else {
        message = message + rawMessage;
      }
    }
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND);
    console.log(`[${triggerAt}]-[${this.constructor.name}] ` + message);
  }

  /**
   * 简易logger
   * @returns  null
   */
  async warn() {
    let message = "";
    for (const rawMessage of arguments) {
      if (_.isString(rawMessage) === false) {
        message = message + JSON.stringify(rawMessage);
      } else {
        message = message + rawMessage;
      }
    }
    const triggerAt = moment().format(DATE_FORMAT.DISPLAY_BY_MILLSECOND);
    console.warn(`[${triggerAt}]-[${this.constructor.name}] ` + message);
  }
}

export default Base;
