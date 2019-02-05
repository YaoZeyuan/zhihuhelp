import axios, { AxiosRequestConfig } from "axios";
import _ from "lodash";

// 创建axios实例
const http = axios.create({
    headers: {
        // 加上ua
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.2490.80 Safari/537.36',
        // 专门注册了个小号
        cookie: '_zap=3fd8e57d-9851-43bc-86fd-87bd40d037be; d_c0="AIDn1X9rfw6PTmXtQW2qhnYAH3-dcEChFTk=|1541849174"; __gads=ID=5be93562e2ced259:T=1543235796:S=ALNI_MbTpbChn_RXx25S996o35d9zsxYxg; _xsrf=r7S8eUASNnQpItjdYo0iMm3RuvN0au0m; q_c1=4a8e46bf1297485ba70bef767b5bcef1|1547370207000|1542015728000; __utmc=155987696; __utmz=155987696.1549074074.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utma=155987696.1436363699.1549074074.1549074074.1549116040.2; tgw_l7_route=025a67177706b199591bd562de56e55b; capsion_ticket="2|1:0|10:1549198417|14:capsion_ticket|44:ZjNiZDcwN2EyMzJiNDVmZGI2NDVmNzQzMWI5Y2I0YTQ=|df88cba1b1cdbd2eff95d63d5a5b28f069d8e210fa5b64a8427537b4eaf52935"; z_c0="2|1:0|10:1549198515|4:z_c0|92:Mi4xbVowc0RnQUFBQUFBZ09mVmYydF9EaVlBQUFCZ0FsVk5zekpFWFFCVm5DZEVyajl5a1Rubjlwb0RIT0pKVzZzNDRR|bb6e45df88f9a36ee147ed92023ed7cd89ae64a7b4f9a0c3f5e5d2d30191e88d"; tst=f'
    }
});

class Http {
    /**
     * 封装get方法
     * @param url
     * @param config
     */
    static async get(url: string, config: AxiosRequestConfig = {}) {
        const response = await http.get(url, config).catch(() => {
            return {};
        });
        const record = _.get(response, ["data"], {});
        return record;
    }

    static raw() {
        return http
    }

    /**
     * 封装post方法
     * @param url
     * @param data
     * @param config
     */
    static async post(url: string, data: any, config: AxiosRequestConfig | undefined) {
        const response = await http.post(url, data, config).catch(() => {
            return {};
        });
        const record = _.get(response, ["data"], {});
        return record;
    }
}

export default Http;
