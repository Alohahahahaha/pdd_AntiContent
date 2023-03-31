# -*- encoding: utf-8 -*-
"""
@Author: Aloha
@Time: 2023/3/19 22:53
@ProjectName: Practice
@FileName: user.py
@Software: PyCharm
"""
import threading
import time
import os, xlwt, xlrd
from xlutils.copy import copy
from requests_html import HTMLSession
# 构造请求对象
session = HTMLSession()


class BiLiBiLiUser(object):
    def __init__(self):
        self.headers = {
            'authority': 'api.bilibili.com',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en,zh-CN;q=0.9,zh;q=0.8,en-US;q=0.7',
            'cookie': 'LIVE_BUVID=AUTO1516404285352815; buvid4=044E554A-19AF-EEF8-CBA5-FBCF5191718E25566-022040715-Lefi4Vcg048bj6SyfCRJMg%3D%3D; buvid_fp_plain=undefined; CURRENT_BLACKGAP=0; blackside_state=0; i-wanna-go-back=-1; nostalgia_conf=-1; DedeUserID=455183647; DedeUserID__ckMd5=4cdccb7211472cb7; b_ut=5; hit-dyn-v2=1; is-2022-channel=1; b_nut=100; CURRENT_QUALITY=80; rpdid=|(k||l~luuRk0J\'uYYm|k~mlm; buvid3=2E2FEDB4-4A0E-3453-67EC-74C1E843C0AD45873infoc; _uuid=966810BC10-641010-CB1010-8B9A-FAA5B1F433C547093infoc; header_theme_version=CLOSE; fingerprint=126bb84f1f4222ff23b886317d43e771; CURRENT_FNVAL=4048; PVID=1; home_feed_column=5; buvid_fp=126bb84f1f4222ff23b886317d43e771; bp_video_offset_455183647=773226351258763300; innersign=0; b_lsid=BCD16EAD_186FA66C872; SESSDATA=9cd6a506%2C1694790287%2Cca376%2A31; bili_jct=26e1e37aff7f9f8cb9a793b7a75d3472; sid=eh1ap82v',
            'origin': 'https://space.bilibili.com',
            'referer': 'https://space.bilibili.com/455183647?spm_id_from=333.1007.0.0',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'
        }

    def userInfo(self, mid):
        """ 用户信息 """
        try:
            url_info = f'https://api.bilibili.com/x/space/wbi/acc/info?mid={mid}'
            response_info = session.get(url_info, headers=self.headers).json()
            res_info = response_info['data']
            uid = res_info['mid']  # mid
            nickname = res_info['name']  # 用户名
            gender = res_info['sex']  # 性别
            face = res_info['face']  # 头像
            vip_status = res_info['vip']['status']  # 大会员状态
            vip_type = res_info['vip']['type']  # 大会员类型
            rank = res_info['rank']  # 排名
            level = res_info['level']  # 等级
            j_time = res_info['jointime']  # 入站时间
            coins = res_info['coins']  # 拥有硬币
            if res_info['sign'] == '':
                sign = 'NO SIGN'
            else:
                sign = res_info['sign']  # 个人签名  ***
            if res_info['birthday'] == '':
                birthday = '无'
            else:
                birthday = res_info['birthday']  # 生日 (默认为 01-01)  ***
            """ 用户关系 """
            url_relation = f'https://api.bilibili.com/x/relation/stat?vmid={mid}&jsonp=jsonp'
            response_rel = session.get(url_relation, headers=self.headers).json()
            res_rel = response_rel['data']
            following = res_rel['following']  # 关注数
            follower = res_rel['follower']  # 粉丝数
            """ 用户作品数据 """
            url_works = f'https://api.bilibili.com/x/space/upstat?mid={mid}&jsonp=jsonp'
            response_works = session.get(url_works, headers=self.headers).json()
            res_works = response_works['data']
            view = res_works['archive']['view']  # 作品播放量
            likes = res_works['likes']  # 获赞数
            data = {
                '用户数据': [uid, nickname, gender, face, sign, birthday, vip_type, vip_status, level, rank,
                         j_time, coins, following, follower,
                         view, likes, url_info]
            }
            # self.SaveExcels(data)
            print(f'用户 {nickname} 数据采集完毕-------------')
        except Exception as e:
            print(f'---------用户id {mid} 不存在----------', e)

    def run(self):
        start = time.time()
        thread = []
        mid = 1
        while True:
            t = threading.Thread(target=self.userInfo, args=(mid,))
            t.start()
            thread.append(t)
            for i in thread:
                i.join()
            mid += 1
            if mid == 100:
                end = time.time()
                print('所需时间', end - start)  # 53.75821399688721  线程
                break


if __name__ == '__main__':
    b = BiLiBiLiUser()
    b.run()
