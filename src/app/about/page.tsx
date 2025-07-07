
import Scan from '../components/Scan';

export default function AboutPage() {
    const content = (<text>1991年，我出生于四川，是一名程序员。点我进入待测功能</text>);
    return (<li>
        <h1>About</h1>
        <view>
            <Scan content={content} />
        </view>
        <br />
        2016年，我加入了一家创业公司，负责开发产品。
        <br />
        2018年，我离开创业公司，加入了一家上市公司，负责开发产品。
        <br />
        2020年，我离开上市公司，加入了一家创业公司，负责开发产品。
        <br />
    </li>)
}