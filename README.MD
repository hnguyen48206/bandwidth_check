# Cài Đặt

Chạy lệnh

npm i https://github.com/hnguyen48206/network_bandwidth_check.git

  

# Ví Dụ Sử Dụng

  

const bandwidthcheck = require('./node_modules/getnetworkusage/index')

bandwidthcheck.initNetworkCheck(

{ IP: null,

notificationInterval: 5000,

testType: 'speedtest',

linuxDistro: 'ubuntu'

}).then(res => {

if (res)

bandwidthcheck.usageNotifier.on('network_usage', (data) => {

console.log(data);

})

})

  

- Hàm initNetworkCheck dùng để start module. Giá trị trả về là 1 biến bool để xác định start thành công hay không. Hàm này nhận vào 1 object có các tham số:

1. IP: input string là IP của mạng cần kiểm tra.

2. notificationInterval: input number là khoảng cách giữa các lần nhận thông báo, tính bằng ms.

3. testType: input string có thể dùng 1 trong 4 giá trị sau để đo bandwidth

+ "self" : sử dụng bài test thuần.

+ "fast" : sử dụng api của netflix.

+ "cloudflare" : sử dụng api của cloudflare.

+ "speedtest" : scraping data của speedtest.

4. linuxDistro: input string có thể dùng 1 trong 2 giá trị sau để xác định đang dùng distro nào của linux

+ "ubuntu" : sử dụng ubuntu distro

+ "alpine" : sử dụng alpine distro

- Sau khi sử dụng hàm init thì có thể subscribe vào usageNotifier để nhận tin push về băng thông cũng như lưu lượng sử dụng thực tế theo mỗi giây. Mẫu data nhận được:

  

{

downloadBandwidth: '388.84 Mbps',

uploadBandwidth: '743.88 Mbps',

currentDownloadUsage: '74.53 Mbps',

currentUploadUsage: '1.41 Mbps'

}