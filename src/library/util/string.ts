class StringUtil {
    /**
     * 
     * @param rawFilename 
     */
    static encodeFilename(rawFilename: string) {
        let encodeFilename = rawFilename
        let illegalCharMap = {
            '\\': '＼',
            '/': '',
            ':': '：',
            '*': '＊',
            '?': '？',
            '<': '《',
            '>': '》',
            '|': '｜',
            '"': '〃',
            '!': '！',
            '\n': '',
            '\r': '',
            '&': 'and',
        }
        for (let key of Object.keys(illegalCharMap)) {
            let legalChar: string = illegalCharMap[key]
            encodeFilename = encodeFilename.replace(key, legalChar)
        }
        return encodeFilename
    }
}
export default StringUtil
