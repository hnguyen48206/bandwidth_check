# Cài Đặt
Chạy lệnh
npm i https://github.com/hnguyen48206/network_bandwidth_check.git

# Ví Dụ Sử Dụng

    const  bandwidthcheck = require('./node_modules/getnetworkusage/index')
    
    bandwidthcheck.initNetworkCheck('speedtest').then(res=>{
    
    if(res)
    
    bandwidthcheck.usageNotifier.on('network_usage', (data)=>{
    
    console.log(data);
    
    })
    
    })

 - Hàm initNetworkCheck dùng để start module. Giá trị trả về là 1 biến bool để xác định start thành công hay không. Hàm này nhận vào 1 input string có thể dùng 1 trong 4 giá trị sau để đo bandwidth:
 
	  + "self" : sử dụng bài test thuần.
	  + "fast" : sử dụng api của netflix.
	  + "cloudflare" : sử dụng api của cloudflare.
	  + "speedtest" : scraping data của speedtest.
 - Sau khi sử dụng hàm init thì có thể subscribe vào usageNotifier để nhận tin push về băng thông cũng như lưu lượng sử dụng thực tế theo mỗi giây. Mẫu data nhận được: 

    {
        downloadBandwidth: '388.84 Mbps',
        uploadBandwidth: '743.88 Mbps',
        currentDownloadUsage: '74.53 Mbps',
        currentUploadUsage: '1.41 Mbps'
    }
