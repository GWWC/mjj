        document.addEventListener('DOMContentLoaded', function() {
            if (!isMobileDevice()) {
                showToast('如需复制分享内容，请关闭<code>沉浸式翻译</code>插件<br>否则可能会影响页面显示');
            }
            fetchExchangeRates();
        });

        function isMobileDevice() {
            const mobileKeywords = ['Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Mobile'];
            return mobileKeywords.some(keyword => navigator.userAgent.includes(keyword));
        }

        function showToast(message) {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'alert alert-primary fade show';
            toast.role = 'alert';
            toast.style.marginBottom = '5px';
            toast.innerHTML = message;

            toastContainer.appendChild(toast);

            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 6000);
        }

        function shareMarkdown() {
            const resultSection = document.querySelector('.result');
            const screenshotResult = document.getElementById('screenshotResult');
            const loadingDiv = document.getElementById('loading');

            if (!resultSection || resultSection.style.display === 'none') {
                showToast('请先完成计算再分享');
                return;
            }

            const dataDate = document.getElementById('dataDate').value || '';
            const purchasePrice = document.getElementById('resultPurchasePriceCNY').textContent || '0.00';
            const remainingValue = document.getElementById('resultRemainingValueCNY').textContent || '0.00';
            const remainingDays = document.getElementById('resultRemainingDays').textContent || '0';
            const remainingMonths = document.getElementById('resultRemainingMonths').textContent || '0';
            const remainingDay = document.getElementById('resultRemainingDay').textContent || '0';
            const tradePrice = document.getElementById('resultTradePriceCNY').textContent || '0.00';
            const premium = document.getElementById('resultPremiumCNY').textContent || '0.00';
            const premiumPercent = document.getElementById('resultPremiumPercent').textContent || '0%';
            const advice = document.getElementById('resultAdvice').textContent || '暂无建议';

            const purchaseCurrency = document.getElementById('purchaseCurrency').value || 'CNY';
            const tradeCurrency = document.getElementById('tradeCurrency').value || 'CNY';
            const purchaseInputValue = parseFloat(document.getElementById('purchasePrice').value);
            const tradeInputValue = parseFloat(document.getElementById('tradePrice').value);
            const purchaseRateValue = parseFloat(document.getElementById('exchangeRate').value);
            const tradeRateValue = parseFloat(document.getElementById('tradeExchangeRate').value);

            const formatAmount = (amount, currency) => {
                if (!Number.isFinite(amount)) {
                    return currency === 'CNY' ? '￥NaN' : `NaN ${currency}`;
                }
                const formatted = amount.toFixed(2);
                return currency === 'CNY' ? `￥${formatted}` : `${formatted} ${currency}`;
            };

            const formatRate = (rate, currency) => {
                if (!Number.isFinite(rate)) {
                    return 'NaN';
                }
                return `1 ${currency} = ${rate.toFixed(4)} CNY`;
            };

            const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false });

            const markdownLines = [];
            markdownLines.push('# 剩余价值计算结果');
            markdownLines.push(`> 汇率数据日期：${dataDate || '暂无数据'}`);
            markdownLines.push('');
            markdownLines.push('| 项目 | 数值 |');
            markdownLines.push('| --- | --- |');
            markdownLines.push(`| 续费货币 | ${purchaseCurrency} |`);
            markdownLines.push(`| 续费金额（${purchaseCurrency}） | ${formatAmount(purchaseInputValue, purchaseCurrency)} |`);
            markdownLines.push(`| 汇率（${purchaseCurrency}→CNY） | ${formatRate(purchaseRateValue, purchaseCurrency)} |`);
            markdownLines.push(`| 续费金额（CNY） | ￥${purchasePrice} |`);
            markdownLines.push(`| 交易货币 | ${tradeCurrency} |`);
            markdownLines.push(`| 交易金额（${tradeCurrency}） | ${formatAmount(tradeInputValue, tradeCurrency)} |`);
            markdownLines.push(`| 汇率（${tradeCurrency}→CNY） | ${formatRate(tradeRateValue, tradeCurrency)} |`);
            markdownLines.push(`| 交易金额（CNY） | ￥${tradePrice} |`);
            markdownLines.push(`| 剩余价值（CNY） | ￥${remainingValue} |`);
            markdownLines.push(`| 剩余天数 | ${remainingDays} 天 (${remainingMonths} 个月余 ${remainingDay} 天) |`);
            markdownLines.push(`| 溢价金额（CNY） | ￥${premium} |`);
            markdownLines.push(`| 溢价幅度 | ${premiumPercent} |`);
            markdownLines.push(`| 购买建议 | ${advice || '暂无建议'} |`);
            markdownLines.push('');
            markdownLines.push(`生成于：${generatedAt}`);

            const markdownContent = markdownLines.join('\n');

            loadingDiv.style.display = 'none';
            screenshotResult.style.display = 'block';
            screenshotResult.innerHTML = `Markdown 分享内容：<pre><code class="language-markdown">${escapeHtml(markdownContent)}</code></pre>`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(markdownContent).then(() => {
                    showToast('分享内容已复制到剪切板');
                }).catch(() => {
                    showToast('自动复制失败，请手动复制下方内容');
                });
            } else {
                showToast('当前环境不支持自动复制，请手动复制下方内容');
            }
        }

        function escapeHtml(text) {
            const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }

        async function fetchExchangeRates() {
            try {
                const response = await fetch('exchange_rates.json');
                const data = await response.json();
                const rates = data.rates;
                const date = data.date;

                document.getElementById('dataDate').value = date;

                updateExchangeRate(document.getElementById('purchaseCurrency'), rates, 'exchangeRate');
                updateExchangeRate(document.getElementById('tradeCurrency'), rates, 'tradeExchangeRate');
                
                document.getElementById('purchaseCurrency').addEventListener('change', function() {
                    updateExchangeRate(this, rates, 'exchangeRate');
                });
                document.getElementById('tradeCurrency').addEventListener('change', function() {
                    updateExchangeRate(this, rates, 'tradeExchangeRate');
                });

                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const day = now.getDate();
                const currentDateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                document.getElementById("currentDate").value = currentDateStr;

            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            }
        }

        function updateExchangeRate(currencyElement, rates, rateInputId) {
            const currency = currencyElement.value;
            const rate = currency === 'CNY' ? 1 : rates[currency];
            document.getElementById(rateInputId).value = rate;
        }

        function calculateRemainingValue() {
            const purchaseCurrency = document.getElementById("purchaseCurrency").value;
            const tradeCurrency = document.getElementById("tradeCurrency").value;
            const exchangeRate = parseFloat(document.getElementById("exchangeRate").value);
            const tradeExchangeRate = parseFloat(document.getElementById("tradeExchangeRate").value);
            const purchasePrice = parseFloat(document.getElementById("purchasePrice").value);
            const tradePrice = parseFloat(document.getElementById("tradePrice").value);
            const currentDate = new Date(document.getElementById("currentDate").value);
            const expiryDate = new Date(document.getElementById("expiryDate").value);
            const paymentFrequency = document.getElementById("paymentFrequency").value;

            const remainingDays = Math.floor((expiryDate - currentDate) / (24 * 60 * 60 * 1000));
            const purchasePriceCNY = purchasePrice * exchangeRate;
            const tradePriceCNY = tradePrice * tradeExchangeRate;
            const remainingValue = calculateValueByFrequency(paymentFrequency, purchasePriceCNY, remainingDays);
            const premium = tradePriceCNY - remainingValue;
            const premiumPercent = ((premium / remainingValue) * 100).toFixed(2);
            
            displayResults(purchasePriceCNY, tradePriceCNY, remainingValue, premium, premiumPercent, remainingDays);
        }

        function calculateValueByFrequency(paymentFrequency, price, days) {
            let daysInPeriod;
            switch(paymentFrequency) {
                case 'yearly': daysInPeriod = 365; break;
                case 'halfyearly': daysInPeriod = 182.5; break;
                case 'quarterly': daysInPeriod = 91.25; break;
                case 'monthly': daysInPeriod = 30.44; break;
                case 'two-yearly': daysInPeriod = 730; break;
                case 'three-yearly': daysInPeriod = 1095; break;
                case 'five-yearly': daysInPeriod = 1825; break;
                default: daysInPeriod = 365;
            }
            return (price / daysInPeriod) * days;
        }

        function displayResults(purchasePrice, tradePrice, remainingValue, premium, premiumPercent, remainingDays) {
            document.getElementById("resultPurchasePriceCNY").textContent = purchasePrice.toFixed(2);
            document.getElementById("resultTradePriceCNY").textContent = tradePrice.toFixed(2);
            document.getElementById("resultRemainingValueCNY").textContent = remainingValue.toFixed(2);
            document.getElementById("resultPremiumCNY").textContent = premium.toFixed(2);
            document.getElementById("resultPremiumPercent").textContent = premiumPercent + "%";

            const remainingMonths = Math.floor(remainingDays / 30);
            const remainingDay = remainingDays % 30;
            document.getElementById("resultRemainingDays").textContent = remainingDays;
            document.getElementById("resultRemainingMonths").textContent = remainingMonths;
            document.getElementById("resultRemainingDay").textContent = remainingDay;

            let advice = getAdvice(premiumPercent);
            document.getElementById("resultAdvice").textContent = advice;

            document.querySelector(".result").style.display = "block";
        }

        function getAdvice(premiumPercent) {
            if (premiumPercent >= 10 && premiumPercent < 30) {
                return "卖家溢价少许，请三思而后行！";
            } else if (premiumPercent >= 30 && premiumPercent < 100) {
                return "存在高溢价，非刚需勿买！";
            } else if (premiumPercent >= 100) {
                return "此乃传家之宝乎？";                
            } else if (premiumPercent <= -30 && premiumPercent > -50) {
                return "卖家血亏，快买，错过拍断大腿！";
            } else if (premiumPercent <= -10 && premiumPercent > -30) {
                return "卖家小亏，买了或许不赚但绝对不亏！";
            } else if (premiumPercent <= -50) {
                return "极端折价，可能存在问题，需谨慎！";    
            } else {
                return "价格合理，良心卖家！";
            }
        }    