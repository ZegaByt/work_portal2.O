import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  Text,
  Group,
  Badge,
  Loader,
  useMantineTheme,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconChevronRight,
  IconCalendarEvent,
  IconInfoCircle,
  IconX,
  IconSun,
  IconMoon,
  IconClock,
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconHourglassLow,
  IconBrightnessHalf,
  IconBrightnessDown,
  IconBrightnessUp,
  IconStar,
  IconZodiacScorpio,
  IconCalendarDue,
  IconConfetti,
} from '@tabler/icons-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  getDay,
  addDays,
  subDays,
} from 'date-fns';

// Custom Hook for Theme Management
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('theme')) {
        return localStorage.getItem('theme');
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return [theme, toggleTheme];
};

// Simulated Panchangam Data Generator
const getSimulatedPanchangamData = (date) => {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const dayOfWeek = date.getDay();

  const hash = (day * 31 + month * 17 + year * 11) % 100;

  const tithis = [
    'పాడ్యమి', 'ద్వితీయ', 'తృతీయ', 'చతుర్థి', 'పంచమి', 'షష్ఠి', 'సప్తమి', 'అష్టమి',
    'నవమి', 'దశమి', 'ఏకాదశి', 'ద్వాదశి', 'త్రయోదశి', 'చతుర్దశి', 'పౌర్ణమి', 'అమావాస్య'
  ];
  const nakshatras = [
    'అశ్విని', 'భరణి', 'కృత్తిక', 'రోహిణి', 'మృగశిర', 'ఆరుద్ర', 'పునర్వసు', 'పుష్యమి',
    'ఆశ్లేష', 'మఖ', 'పూర్వ ఫల్గుణి', 'ఉత్తర ఫల్గుణి', 'హస్త', 'చిత్త', 'స్వాతి', 'విశాఖ',
    'అనురాధ', 'జ్యేష్ఠ', 'మూల', 'పూర్వాషాడ', 'ఉత్తరాషాడ', 'శ్రవణం', 'ధనిష్ఠ',
    'శతభిష', 'పూర్వాభాద్ర', 'ఉత్తరాభాద్ర', 'రేవతి'
  ];
  const yogas = [
    'విష్కంభ', 'ప్రీతి', 'ఆయుష్మాన్', 'సౌభాగ్య', 'శోభన', 'అతిగండ', 'సుకర్మ', 'ధృతి'
  ];
  const karanas = [
    'బాలవ', 'కౌలవ', 'తైతెల', 'గరజ', 'వణిజ', 'విష్టి', 'శకుని', 'చతుష్పాద'
  ];
  const teluguMonths = [
    'చైత్రము', 'వైశాఖము', 'జ్యేష్ఠము', 'ఆషాడము', 'శ్రావణము', 'భాద్రపదము',
    'ఆశ్వయుజము', 'కార్తీకము', 'మార్గశిరము', 'పుష్యము', 'మాఘము', 'ఫాల్గుణము'
  ];
  const teluguWeekdays = [
    'ఆదివారం', 'సోమవారం', 'మంగళవారం', 'బుధవారం', 'గురువారం', 'శుక్రవారం', 'శనివారం'
  ];

  const randomItem = (arr, offset) => arr[(hash + offset) % arr.length];

  const festivals = {
    '3-29': 'ఉగాది (శనివారం)',
    '7-4': 'ఆషాడ బోనాలు (ఉదాహరణ)',
    '10-24': 'దసరా (ఉదాహరణ)',
    '11-12': 'దీపావళి (ఉదాహరణ)',
    '1-14': 'సంక్రాంతి (ఉదాహరణ)',
  };

  const currentMonthDay = `${month + 1}-${day}`;
  const festivalName = festivals[currentMonthDay];

  if (date.getFullYear() === 2025 && date.getMonth() === 6 && date.getDate() === 4) {
    return {
      gregorianDate: format(date, 'EEEE, MMMM d, yyyy'),
      teluguYear: 'శ్రీ విశ్వావసు నామ సంవత్సరం',
      ayanam: 'ఉత్తరాయణం',
      ruthuvu: 'గ్రీష్మ ఋతువు',
      masam: 'ఆషాడ మాసం',
      paksham: 'శుక్లపక్షం',
      tithi: 'నవమి',
      tithiEndTime: 'రా. 1:38+ వరకు (మరుసటి రోజు)',
      nakshatram: 'చిత్తా',
      nakshatramEndTime: 'రా. 1:20+ వరకు (మరుసటి రోజు)',
      yogam: 'పరిఘ',
      yogamEndTime: 'సా. 6:29 వరకు',
      karanam: 'బాలవ',
      karanamEndTime: 'రా. 1:38+ వరకు (మరుసటి రోజు)',
      vaaram: 'శుక్రవారం',
      sunrise: 'తె. 5:49 AM',
      sunset: 'సా. 6:50 PM',
      rahukalam: 'మ. 1:58 PM - మ. 3:35 PM',
      yamagandam: 'తె. 5:49 AM - ఉ. 7:27 AM',
      gulikakalam: 'ఉ. 9:05 AM - ఉ. 10:42 AM',
      amritagadiyalu: 'ఉ. 7:09 AM - ఉ. 8:56 AM',
      durmuhurtham: 'ఉ. 10:10 AM - ఉ. 11:02 AM & మ. 3:22 PM - సా. 4:14 PM',
      abhijitmuhurtham: 'ఉ. 11:54 AM - మ. 12:46 PM',
      festivals: festivalName ? [festivalName] : ['(పండుగలు లేవు)'],
    };
  }

  return {
    gregorianDate: format(date, 'EEEE, MMMM d, yyyy'),
    teluguYear: 'శ్రీ విశ్వావసు నామ సంవత్సరం',
    ayanam: randomItem(['ఉత్తరాయణం', 'దక్షిణాయణం'], 0),
    ruthuvu: randomItem(['వసంత', 'గ్రీష్మ', 'వర్ష', 'శరద్', 'హేమంత', 'శిశిర'], 1),
    masam: teluguMonths[month],
    paksham: (day % 2 === 0) ? 'శుక్లపక్షం' : 'కృష్ణపక్షం',
    tithi: randomItem(tithis, 2),
    tithiEndTime: `మ. ${(hash % 5) + 1} PM వరకు`,
    nakshatram: randomItem(nakshatras, 3),
    nakshatramEndTime: `రా. ${(hash % 6) + 7} PM వరకు`,
    yogam: randomItem(yogas, 4),
    yogamEndTime: `ఉ. ${(hash % 4) + 8} AM వరకు`,
    karanam: randomItem(karanas, 5),
    karanamEndTime: `మ. ${(hash % 3) + 1} PM వరకు`,
    vaaram: teluguWeekdays[dayOfWeek],
    sunrise: 'తె. 5:XX AM',
    sunset: 'సా. 6:YY PM',
    rahukalam: 'N/A',
    yamagandam: 'N/A',
    gulikakalam: 'N/A',
    amritagadiyalu: 'N/A',
    durmuhurtham: 'N/A',
    abhijitmuhurtham: 'N/A',
    festivals: festivalName ? [festivalName] : ['(పండుగలు లేవు)'],
  };
};

const TeluguCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayPanchangam, setSelectedDayPanchangam] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const theme = useMantineTheme();
  const [themeMode, toggleTheme] = useTheme();

  const getThemedColor = useCallback((lightColor, darkColor) =>
    themeMode === 'dark' ? darkColor : lightColor, [themeMode]);

  // Explicitly set background colors to avoid transparency
  const backgroundColor = getThemedColor('#FFFFFF', theme.colors.dark[9]); // Opaque white in light mode
  const cardBackgroundColor = getThemedColor('#FFFFFF', theme.colors.dark[8]);
  const modalBackgroundColor = getThemedColor('#FFFFFF', theme.colors.dark[8]); // Ensure modal is opaque
  const primaryAccent = getThemedColor(theme.colors.red[7], theme.colors.red[4]);
  const secondaryAccent = getThemedColor(theme.colors.orange[6], theme.colors.orange[3]);
  const dayCellBgColor = getThemedColor(theme.colors.white, theme.colors.dark[7]);
  const dimmedDayCellBgColor = getThemedColor(theme.colors.gray[1], theme.colors.dark[7]);
  const dayCellHoverBg = getThemedColor(theme.colors.orange[1], theme.colors.dark[6]);
  const textColor = getThemedColor(theme.colors.gray[9], theme.colors.gray[0]);
  const dimmedTextColor = getThemedColor(theme.colors.gray[6], theme.colors.gray[4]);
  const borderColor = getThemedColor(theme.colors.gray[3], theme.colors.dark[5]);
  const todayBorderColor = getThemedColor(theme.colors.blue[6], theme.colors.blue[4]);
  const selectedBorderColor = getThemedColor(theme.colors.orange[6], theme.colors.orange[4]);
  const festivalColor = getThemedColor(theme.colors.red[7], theme.colors.red[4]);
  const sundayBgColor = getThemedColor(theme.colors.red[0], theme.colors.dark[9]);
  const sundayTextColor = getThemedColor(theme.colors.red[8], theme.colors.red[2]);
  const weekdayHeaderBgColor = getThemedColor(theme.colors.gray[0], theme.colors.dark[6]);

  const statusColors = useMemo(() => ({
    auspicious: getThemedColor(theme.colors.green[6], theme.colors.green[4]),
    inauspicious: getThemedColor(theme.colors.red[6], theme.colors.red[4]),
    neutral: getThemedColor(theme.colors.blue[6], theme.colors.blue[4]),
  }), [themeMode, theme]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const allDaysInGrid = useMemo(() => {
    const startDay = startOfMonth(currentMonth);
    const firstDayOfWeek = getDay(startDay);
    const startDate = subDays(startDay, firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  }, [currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prevMonth) => subMonths(prevMonth, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prevMonth) => addMonths(prevMonth, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  const handleDayClick = useCallback((date) => {
    const panchangam = getSimulatedPanchangamData(date);
    setSelectedDayPanchangam(panchangam);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDayPanchangam(null);
  }, []);

  const renderPanchangamDetail = (label, value, icon, isAuspicious = null) => {
    let valueColor = dimmedTextColor;
    let iconColor = dimmedTextColor;

    if (isAuspicious === true) {
      valueColor = statusColors.auspicious;
      iconColor = statusColors.auspicious;
    } else if (isAuspicious === false) {
      valueColor = statusColors.inauspicious;
      iconColor = statusColors.inauspicious;
    } else {
      valueColor = textColor;
      iconColor = primaryAccent;
    }

    return (
      <Group spacing="xs" wrap="nowrap" className="items-center">
        {React.cloneElement(icon, { size: 20, style: { color: iconColor, flexShrink: 0 } })}
        <Text size="sm" style={{ color: dimmedTextColor }}>
          {label}:
        </Text>
        <Text size="sm" fw={500} style={{ color: valueColor, flexGrow: 1 }}>
          {value || 'N/A'}
        </Text>
      </Group>
    );
  };

  return (
    <div
      className="min-h-screen p-4 sm:p-8 md:p-12 flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor, opacity: 1 }}
    >
      <Card
        shadow="lg"
        padding="xl"
        radius="xl"
        withBorder
        className="max-w-6xl w-full animate-fade-in-up"
        style={{
          backgroundColor: cardBackgroundColor,
          borderColor,
          color: textColor,
          minHeight: '700px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          opacity: 1,
        }}
      >
        {/* Calendar Header */}
        <div
          className="p-4 sm:p-6 bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-800 dark:to-amber-700 text-white flex items-center justify-between rounded-t-xl -mx-6 -mt-6 mb-6 shadow-sm"
          style={{ opacity: 1 }}
        >
          <button
            onClick={goToPreviousMonth}
            className="p-3 rounded-full hover:bg-white/30 transition-colors duration-200"
            aria-label="Previous month"
          >
            <IconChevronLeft size={30} />
          </button>
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <IconCalendarEvent size={34} />
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-3 rounded-full hover:bg-white/30 transition-colors duration-200"
            aria-label="Next month"
          >
            <IconChevronRight size={30} />
          </button>
        </div>

        {/* Action Buttons */}
        <div
          className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center border-b -mx-6"
          style={{ backgroundColor: weekdayHeaderBgColor, borderColor, opacity: 1 }}
        >
          <button
            onClick={goToToday}
            className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 shadow-md text-sm sm:text-base flex items-center gap-2 mb-3 sm:mb-0"
          >
            <IconCalendarDue size={22} /> Today
          </button>
          <button
            onClick={toggleTheme}
            className="w-full sm:w-auto px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 shadow-md text-sm sm:text-base flex items-center gap-2"
            aria-label={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} theme`}
          >
            {themeMode === 'light' ? <IconMoon size={22} /> : <IconSun size={22} />}
            <span>{themeMode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        {/* Weekday Headers */}
        <div
          className="grid grid-cols-7 text-center font-semibold text-base py-4 border-b -mx-6"
          style={{ backgroundColor: weekdayHeaderBgColor, borderColor, opacity: 1 }}
        >
          {weekDays.map((day) => (
            <div key={day} style={{ color: dimmedTextColor }} className="text-sm sm:text-base">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2 p-4 sm:p-6 flex-grow">
          {allDaysInGrid.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            const isSunday = getDay(day) === 0;
            const panchangam = getSimulatedPanchangamData(day);
            const isFestivalDay = panchangam.festivals && panchangam.festivals[0] !== '(పండుగలు లేవు)';

            let currentDayCellBg = dayCellBgColor;
            if (!isCurrentMonth) {
              currentDayCellBg = dimmedDayCellBgColor;
            }
            if (isSunday) {
              currentDayCellBg = sundayBgColor;
            }

            return (
              <div
                key={index}
                className={`
                  relative p-2 sm:p-3 aspect-square flex flex-col items-center rounded-xl cursor-pointer
                  transition-all duration-300 ease-in-out group text-center
                  ${!isCurrentMonth ? 'opacity-50 pointer-events-none' : ''}
                  ${isTodayDate ? 'border-2' : 'border'}
                  ${isCurrentMonth ? 'hover:shadow-lg transform hover:scale-105' : ''}
                  overflow-hidden
                  day-cell
                `}
                onClick={() => isCurrentMonth && handleDayClick(day)}
                style={{
                  borderColor: isTodayDate ? todayBorderColor : borderColor,
                  backgroundColor: currentDayCellBg,
                  '--day-cell-hover-bg': dayCellHoverBg,
                  opacity: 1,
                }}
              >
                <span
                  className="text-lg sm:text-xl font-bold"
                  style={{
                    color: isTodayDate ? todayBorderColor : (isCurrentMonth ? textColor : dimmedTextColor),
                    ...(isSunday && { color: sundayTextColor }),
                  }}
                >
                  {format(day, 'd')}
                </span>
                <span
                  className="text-xs sm:text-sm mt-1"
                  style={{
                    color: isCurrentMonth ? primaryAccent : dimmedTextColor,
                    ...(isSunday && { color: sundayTextColor }),
                  }}
                >
                  {panchangam.tithi}
                </span>
                <span
                  className="text-xs sm:text-sm mt-0.5 overflow-hidden whitespace-nowrap text-ellipsis px-1 w-full"
                  style={{
                    color: isCurrentMonth ? secondaryAccent : dimmedTextColor,
                    ...(isSunday && { color: sundayTextColor }),
                  }}
                >
                  {panchangam.nakshatram}
                </span>
                {isFestivalDay && (
                  <div
                    className="absolute bottom-1 left-1 right-1 text-[10px] sm:text-xs text-center font-medium truncate flex items-center justify-center gap-1"
                    style={{ color: festivalColor }}
                  >
                    <IconConfetti size={14} className="flex-shrink-0" />
                    {panchangam.festivals[0].split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Panchangam Detail Modal */}
        {isModalOpen && selectedDayPanchangam && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in-overlay"
            style={{ opacity: 1 }}
          >
            <div
              className="rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-xl transform scale-95 animate-scale-up border"
              style={{
                backgroundColor: modalBackgroundColor,
                borderColor,
                color: textColor,
                opacity: 1,
              }}
            >
              <div
                className="flex justify-between items-center border-b pb-4 mb-6"
                style={{ borderColor, opacity: 1 }}
              >
                <h3
                  className="text-xl sm:text-2xl font-bold flex items-center gap-3"
                  style={{ color: primaryAccent }}
                >
                  <IconInfoCircle size={26} />
                  Panchangam for {selectedDayPanchangam.gregorianDate}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                  aria-label="Close"
                >
                  <IconX size={26} />
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3">
                <Text size="md" fw={600} style={{ color: textColor }}>
                  ముఖ్యమైన వివరాలు (Key Details):
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {renderPanchangamDetail('సంవత్సరం', selectedDayPanchangam.teluguYear, <IconStar />)}
                  {renderPanchangamDetail('అయనం', selectedDayPanchangam.ayanam, <IconSun />)}
                  {renderPanchangamDetail('ఋతువు', selectedDayPanchangam.ruthuvu, <IconBrightnessHalf />)}
                  {renderPanchangamDetail('మాసం', selectedDayPanchangam.masam, <IconCalendarEvent />)}
                  {renderPanchangamDetail('పక్షం', selectedDayPanchangam.paksham, <IconMoon />)}
                  {renderPanchangamDetail('వారం', selectedDayPanchangam.vaaram, <IconCalendarDue />)}
                  {renderPanchangamDetail('తిథి', `${selectedDayPanchangam.tithi} (${selectedDayPanchangam.tithiEndTime || 'N/A'})`, <IconClock />)}
                  {renderPanchangamDetail('నక్షత్రం', `${selectedDayPanchangam.nakshatram} (${selectedDayPanchangam.nakshatramEndTime || 'N/A'})`, <IconZodiacScorpio />)}
                  {renderPanchangamDetail('యోగం', `${selectedDayPanchangam.yogam} (${selectedDayPanchangam.yogamEndTime || 'N/A'})`, <IconBrightnessUp />)}
                  {renderPanchangamDetail('కరణం', `${selectedDayPanchangam.karanam} (${selectedDayPanchangam.karanamEndTime || 'N/A'})`, <IconBrightnessDown />)}
                </div>

                <Text size="md" fw={600} className="mt-6" style={{ color: textColor }}>
                  సమయాలు (Timings):
                </Text>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {renderPanchangamDetail('సూర్యోదయం', selectedDayPanchangam.sunrise, <IconSun />, true)}
                  {renderPanchangamDetail('సూర్యాస్తమయం', selectedDayPanchangam.sunset, <IconMoon />, true)}
                  {renderPanchangamDetail('రాహుకాలం', selectedDayPanchangam.rahukalam, <IconCircleX />, false)}
                  {renderPanchangamDetail('యమగండం', selectedDayPanchangam.yamagandam, <IconCircleX />, false)}
                  {renderPanchangamDetail('గుళికాకాలం', selectedDayPanchangam.gulikakalam, <IconHourglassLow />, null)}
                  {renderPanchangamDetail('అమృత ఘడియలు', selectedDayPanchangam.amritagadiyalu, <IconCircleCheck />, true)}
                  {renderPanchangamDetail('దుర్ముహూర్తం', selectedDayPanchangam.durmuhurtham, <IconCircleX />, false)}
                  {renderPanchangamDetail('అభిజిత్ ముహూర్తం', selectedDayPanchangam.abhijitmuhurtham, <IconCircleCheck />, true)}
                </div>

                {selectedDayPanchangam.festivals && selectedDayPanchangam.festivals[0] !== '(పండుగలు లేవు)' && (
                  <>
                    <Text size="md" fw={600} className="mt-6" style={{ color: textColor }}>
                      పండుగలు (Festivals):
                    </Text>
                    <Group spacing="sm" className="flex-wrap">
                      {selectedDayPanchangam.festivals.map((festival, index) => (
                        <Badge key={index} color="red" variant="filled" size="lg" radius="md" className="capitalize">
                          {festival}
                        </Badge>
                      ))}
                    </Group>
                  </>
                )}
              </div>
              <p className="mt-6 text-sm text-center" style={{ color: dimmedTextColor }}>
                *గమనిక: ఈ పంచాంగం డేటా ఉదాహరణ ప్రదర్శన కోసం మాత్రమే. ఖచ్చితమైన వివరాల కోసం ప్రామాణిక పంచాంగాన్ని సంప్రదించండి.
              </p>
            </div>
          </div>
        )}
      </Card>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-up {
          animation: scaleUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in-overlay {
          animation: fadeInOverlay 0.3s ease-out forwards;
        }

        .day-cell:hover {
          background-color: var(--day-cell-hover-bg) !important;
        }

        /* Ensure no parent container introduces transparency */
        .min-h-screen {
          background-color: inherit;
          opacity: 1 !important;
        }

        /* Ensure modal overlay is semi-transparent but content is opaque */
        .modal-overlay {
          background-color: rgba(0, 0, 0, 0.8);
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default TeluguCalendar;