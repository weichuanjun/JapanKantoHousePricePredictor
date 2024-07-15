document.addEventListener('DOMContentLoaded', function () {
    var prefectureSelect = document.getElementById('prefecture');
    var citySelect = document.getElementById('city');
    var districtSelect = document.getElementById('district');
    var stationSelect = document.getElementById('station');
    var propertyTypeRadios = document.getElementsByName('property_type');
    var houseInputs = document.getElementById('houseInputs');
    var apartmentInputs = document.getElementById('apartmentInputs');
    // var chartsContainer = document.querySelector('.charts-container');
    var tabs = document.querySelectorAll('.tab');
    var queryForm = document.getElementById('queryForm');
    var promptInput = document.getElementById('prompt');
    var responseContainer = document.getElementById('responseContainer');
    var myForm = document.forms['myForm'];
    var sendIcon = document.getElementById('sendIcon');
    var analyzeButton = document.getElementById('analyzeButton');

    var cityToDistricts = {};
    let contextMessages = [];


    // 从服务器获取位置数据
    fetch('/get_location_data')
        .then(response => response.json())
        .then(data => {
            cityToDistricts = data;
            initializeSelects();
        })
        .catch(error => console.error('Error fetching location data:', error));

    function initializeSelects() {
        prefectureSelect.innerHTML = '<option value="">都道府県名を選んでください</option>';
        Object.keys(cityToDistricts).forEach(prefecture => {
            var option = new Option(prefecture, prefecture);
            prefectureSelect.add(option);
        });

        restoreFormData();
    }

    function updateCityOptions(prefecture, selectedCity, selectedDistrict) {
        citySelect.innerHTML = '<option value="">市区町村名を選んでください</option>';
        districtSelect.innerHTML = '<option value="">地区名を選んでください</option>';
        stationSelect.innerHTML = '<option value="">最寄駅を選んでください</option>';

        if (prefecture && cityToDistricts[prefecture]) {
            Object.keys(cityToDistricts[prefecture]).forEach(city => {
                var option = new Option(city, city);
                citySelect.add(option);
            });

            if (selectedCity) {
                citySelect.value = selectedCity;
                updateDistrictOptions(prefecture, selectedCity, selectedDistrict);
            }
        }
    }

    function updateDistrictOptions(prefecture, city, selectedDistrict) {
        districtSelect.innerHTML = '<option value="">地区名を選んでください</option>';
        stationSelect.innerHTML = '<option value="">最寄駅を選んでください</option>';

        if (prefecture && city && cityToDistricts[prefecture][city]) {
            Object.keys(cityToDistricts[prefecture][city]).forEach(district => {
                var option = new Option(district, district);
                districtSelect.add(option);
            });

            if (selectedDistrict) {
                districtSelect.value = selectedDistrict;
                updateStationOptions(prefecture, city, selectedDistrict);
            }
        }
    }

    function updateStationOptions(prefecture, city, district, selectedStation) {
        stationSelect.innerHTML = '<option value="">最寄駅を選んでください</option>';

        if (prefecture && city && district && cityToDistricts[prefecture][city][district]) {
            cityToDistricts[prefecture][city][district].forEach(station => {
                var option = new Option(station, station);
                stationSelect.add(option);
            });

            if (selectedStation) {
                stationSelect.value = selectedStation;
            }
        }
    }

    function setRequiredFields(type) {
        var houseFields = document.querySelectorAll('#houseInputs input, #houseInputs select');
        var apartmentFields = document.querySelectorAll('#apartmentInputs input, #apartmentInputs select');

        houseFields.forEach(input => input.required = (type === 'house'));
        apartmentFields.forEach(input => input.required = (type === 'apartment'));

        houseInputs.style.display = type === 'house' ? 'block' : 'none';
        apartmentInputs.style.display = type === 'apartment' ? 'block' : 'none';
    }

    function displayCharts(type) {
        var chartsBox = document.querySelector('.charts-box');
        if (chartsBox) {
            chartsBox.querySelectorAll('.chart').forEach(chart => {
                chart.style.display = 'none';
            });
            chartsBox.querySelectorAll(`.chart.${type}`).forEach(chart => {
                chart.style.display = 'block';
            });
        }
    }

    function validateForm() {
        var propertyType = myForm['property_type'].value;
        var requiredFields = propertyType === 'house'
            ? ['house_land_area', 'house_building_area', 'house_structure', 'house_age']
            : ['apartment_area', 'apartment_structure', 'apartment_layout', 'apartment_age'];

        for (var i = 0; i < requiredFields.length; i++) {
            var field = requiredFields[i];
            var fieldValue = myForm[field].value.trim();
            if (!fieldValue) {
                alert('すべてのデータを入力してください。');
                return false;
            }

            if (['house_land_area', 'house_building_area', 'house_age', 'apartment_area', 'apartment_age'].includes(field)) {
                if (isNaN(parseFloat(fieldValue))) {
                    alert('数値を入力してください。');
                    return false;
                }
            }
        }

        saveFormData();
        return true;
    }

    // sessionStorage
    function saveFormData() {
        const formData = {
            prefecture: prefectureSelect.value,
            city: citySelect.value,
            district: districtSelect.value,
            station: stationSelect.value,
            property_type: document.querySelector('input[name="property_type"]:checked')?.value
        };
        sessionStorage.setItem('formData', JSON.stringify(formData));
    }

    // 从 sessionStorage 恢复表单数据
    function restoreFormData() {
        const storedData = sessionStorage.getItem('formData');
        if (storedData) {
            const formData = JSON.parse(storedData);
            prefectureSelect.value = formData.prefecture;
            updateCityOptions(formData.prefecture, formData.city, formData.district);
            // 确保在更新区域选项后再设置车站
            setTimeout(() => {
                updateStationOptions(formData.prefecture, formData.city, formData.district, formData.station);
            }, 0);
            const propertyTypeRadio = document.querySelector(`input[name="property_type"][value="${formData.property_type}"]`);
            if (propertyTypeRadio) {
                propertyTypeRadio.checked = true;
                setRequiredFields(formData.property_type);
            }
        }
    }

    prefectureSelect.addEventListener('change', function () {
        updateCityOptions(prefectureSelect.value);
        saveFormData();
    });

    citySelect.addEventListener('change', function () {
        updateDistrictOptions(prefectureSelect.value, citySelect.value);
        saveFormData();
    });

    districtSelect.addEventListener('change', function () {
        updateStationOptions(prefectureSelect.value, citySelect.value, districtSelect.value);
        saveFormData();
    });

    stationSelect.addEventListener('change', saveFormData);

    propertyTypeRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            setRequiredFields(this.value);
            saveFormData();
        });
    });

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            displayCharts(this.getAttribute('data-type'));
        });
    });

    var checkedPropertyType = document.querySelector('input[name="property_type"]:checked');
    if (checkedPropertyType) {
        setRequiredFields(checkedPropertyType.value);
    }

    var activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        displayCharts(activeTab.getAttribute('data-type'));
    } else if (tabs.length > 0) {
        tabs[0].classList.add('active');
        displayCharts(tabs[0].getAttribute('data-type'));
    }
    // 添加图标点击事件监听器
    if (sendIcon) {
        sendIcon.addEventListener('click', function () {
            handleQuery(); // 调用处理查询的函数
        });
    }

    // function handleQuery() {
    //     const prompt = promptInput.value;
    //     const responseEntry = document.createElement('div');
    //     responseEntry.classList.add('response-entry');
    //     responseContainer.appendChild(responseEntry); // 将新响应添加到底部
    //     responseContainer.scrollTop = responseContainer.scrollHeight; // 滚动到底部

    //     let accumulatedResponse = ''; // 累积响应内容

    //     const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);

    //     eventSource.onmessage = function (event) {
    //         accumulatedResponse += event.data;
    //         responseEntry.textContent = accumulatedResponse; // 更新响应内容
    //         responseContainer.scrollTop = responseContainer.scrollHeight; // 滚动到底部
    //     };

    //     eventSource.onerror = function () {
    //         eventSource.close();
    //     };

    //     promptInput.value = ''; // 清空输入框
    // }

    // let contextMessages = [];

    // // 处理流式响应的函数
    // function handleStreamResponse(eventSource, append = false) {
    //     let accumulatedResponse = ''; // 累积响应内容
    //     const responseEntry = document.createElement('div');
    //     responseEntry.classList.add('response-entry');

    //     if (!append) {
    //         responseContainer.innerHTML = ''; // 清空之前的响应内容
    //     }

    //     responseContainer.appendChild(responseEntry); // 将新响应添加到底部

    //     eventSource.onmessage = function (event) {
    //         // // accumulatedResponse += event.data.replace(/\n/g, ''); // 累积并移除换行符
    //         // accumulatedResponse += event.data + '\n';
    //         accumulatedResponse += event.data;
    //         // 在遇到数字加点的情况时插入换行符
    //         const formattedResponse = accumulatedResponse.replace(/(\d+\.)/g, '\n$1');
    //         // const formattedResponse = accumulatedResponse.replace(/(\*\*\d+\.)/g, '\n$1');
    //         // accumulatedResponse += event.data; // 累积并移除换行符
    //         // responseEntry.textContent = accumulatedResponse; // 实时更新响应内容
    //         responseEntry.innerHTML = marked(formattedResponse); // 响应完成后，将Markdown内容转换为HTML
    //         responseContainer.scrollTop = responseContainer.scrollHeight; // 滚动到底部
    //     };
    //     eventSource.onclose = function () {

    //     };


    //     eventSource.onerror = function () {
    //         eventSource.close();
    //     };
    // }

    // function handleQuery() {
    //     const prompt = promptInput.value;
    //     // contextMessages.push({ role: 'user', content: prompt });
    //     const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);
    //     handleStreamResponse(eventSource);
    //     promptInput.value = ''; // 清空输入框
    // }

    // // 处理地域分析
    // // 处理地域分析
    // if (analyzeButton) {
    //     analyzeButton.addEventListener('click', function () {
    //         var prefecture = prefectureSelect.value;
    //         var city = citySelect.value;
    //         var district = districtSelect.value;
    //         var station = stationSelect.value;

    //         if (!prefecture || !city || !district || !station) {
    //             alert('すべての地域情報を入力してください。');
    //             return;
    //         }

    //         const prompt = `答えは全て日本語で、英語を利用しないでください。英語を利用したい場合、結果を日本語に通訳して下さい。以下の地域について分析してください：都道府県: ${prefecture}， 市区町村: ${city}，地区: ${district}，最寄駅: ${station}。この地域について、以下の点を含めて詳しく分析してください：1. 周辺環境，2. 生活の利便性，3. 交通アクセス，4. 地域の特徴や魅力，5. 住宅市場の傾向，6. 将来の発展性。7.この地域に住むことのメリット 8.この地域に住むことのデメリット できるだけ具体的な情報を提供する、`;
    //         // contextMessages.push({ role: 'user', content: prompt });
    //         const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);
    //         handleStreamResponse(eventSource, true);
    //     });
    // }
    // 处理流式响应的函数
    function handleStreamResponse(eventSource, append = false) {
        let accumulatedResponse = ''; // 累积响应内容
        const responseEntry = document.createElement('div');
        responseEntry.classList.add('response-entry');
        responseEntry.textContent = 'Thinking...';


        if (!append) {
            responseContainer.innerHTML = ''; // 清空之前的响应内容
        }

        responseContainer.appendChild(responseEntry); // 将新响应添加到底部

        eventSource.onmessage = function (event) {
            accumulatedResponse += event.data;
            const formattedResponse = accumulatedResponse
                // .replace(/(\d+\..+?):/g, '\n$1\n')// 在匹配到的数字加点加文字加冒号前后插入换行符
                // .replace(/(\d+\.)/g, '\n$1')
                .replace(/(\*\*[^*]+\*\*)/g, '\n$1\n');

            // const formattedResponse = accumulatedResponse
            //     .replace(/(\*\*[^*]+\*\*)/g, '\n$1\n')   // 在匹配到的**任何文字**前后插入换行符
            //     // .replace(/(\*[^*]+\*)/g, '\n$1\n')       // 在匹配到的*任何文字*前后插入换行符
            //     .replace(/(\d+\..+?):/g, '\n$1:\n');     // 在匹配到的数字加点加文字加冒号前后插入换行符

            // const formattedResponse = accumulatedResponse.replace(/(\*\*[^*]+\*\*)/g, '\n$1\n'); // 在匹配到的**任何文字**前后插入换行符
            // const formattedResponse = accumulatedResponse.replace(/(\d+\.)/g, '\n$1');
            responseEntry.innerHTML = marked(formattedResponse); // 实时更新响应内容，将Markdown内容转换为HTML
            responseContainer.scrollTop = responseContainer.scrollHeight; // 滚动到底部
        };

        eventSource.onerror = function () {
            eventSource.close();
            analyzeButton.classList.remove('onhover');
        };
        eventSource.onclose = function () {
            analyzeButton.classList.remove('onhover'); // 请求完成后移除悬停样式
        };

    }

    // function sendPromptToLlama(prompt) {
    //     const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);
    //     handleStreamResponse(eventSource);
    //     promptInput.value = ''; // 清空输入框
    // }

    // function sendPromptToLlama(prompt) {
    //     const contextPrefix = `以下の回答はすべて、都道府県: ${prefectureSelect.value}， 市区町村: ${citySelect.value}，地区: ${districtSelect.value}，最寄駅: ${stationSelect.value}。についてのものです。`;
    //     const combinedPrompt = contextMessages.map(msg => msg.content).join('\n') + `\n${contextPrefix}\n${prompt}`;
    //     const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(combinedPrompt)}`);
    //     contextMessages.push({ role: 'user', content: prompt });
    //     handleStreamResponse(eventSource);
    //     promptInput.value = ''; // 清空输入框
    // }

    function sendPromptToLlama(prompt, addContext = false) {
        if (addContext) {
            const contextPrefix = `以下の回答はすべて、都道府県: ${prefectureSelect.value}， 市区町村: ${citySelect.value}，地区: ${districtSelect.value}，最寄駅: ${stationSelect.value}。についてのものです。`;
            prompt = `${contextPrefix}\n${prompt}`;
        }
        const eventSource = new EventSource(`/query?prompt=${encodeURIComponent(prompt)}`);
        contextMessages.push({ role: 'user', content: prompt });
        handleStreamResponse(eventSource);
        promptInput.value = '';
        analyzeButton.classList.add('onhover');
    }

    function handleQuery() {
        const prompt = promptInput.value;
        sendPromptToLlama(prompt, true);
    }

    if (analyzeButton) {
        analyzeButton.addEventListener('click', function () {
            var prefecture = prefectureSelect.value;
            var city = citySelect.value;
            var district = districtSelect.value;
            var station = stationSelect.value;

            if (!prefecture || !city || !district || !station) {
                alert('すべての地域情報を入力してください。');
                return;
            }

            const prompt = `答えは全て日本語で、英語を利用しないでください。英語を利用したい場合、結果を日本語に通訳して下さい。以下の地域について分析してください：都道府県: ${prefecture}， 市区町村: ${city}，地区: ${district}，最寄駅: ${station}。この地域について、以下の点を含めて詳しく分析してください：周辺環境，生活の利便性交通アクセス，地域の特徴や魅力，住宅市場の傾向，家賃の相場 将来の発展性。できるだけ具体的な情報を提供する、`;
            sendPromptToLlama(prompt);
        });
    }

    if (queryButton) {
        queryButton.addEventListener('click', handleQuery);
    }


    var initialActiveTab = document.querySelector('.tab.active');
    if (initialActiveTab) {
        displayCharts(initialActiveTab.getAttribute('data-type'));
    } else if (tabs.length > 0) {
        tabs[0].classList.add('active');
        displayCharts(tabs[0].getAttribute('data-type'));
    }

    window.validateForm = validateForm;

});