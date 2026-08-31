import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * =========================================================================
 * 📅 ปฏิทินและนาฬิกาเลือกวันเวลา (Interactive Calendar & Time Picker Modal)
 * =========================================================================
 * 💡 อธิบายการทำงาน:
 * 1. โหมด Date: แสดงปฏิทินรายเดือนภาษาไทย (พ.ศ.) ให้กดแตะเลือกวันได้ทันที
 * 2. โหมด Time: แสดงตัวเลือกชั่วโมงและนาที พร้อมปุ่มลัด (ช่วงเช้า, เที่ยง, บ่าย, เย็น)
 * 3. ไม่ต้องพิมพ์ข้อความเอง ป้องกันการพิมพ์ผิดรูปแบบ
 * =========================================================================
 */

interface SUTDateTimePickerModalProps {
  visible: boolean;
  mode: 'date' | 'time';
  currentValue: string; // เช่น '31/8/2569' หรือ '14:30'
  onConfirm: (value: string) => void;
  onClose: () => void;
}

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export const SUTDateTimePickerModal: React.FC<SUTDateTimePickerModalProps> = ({
  visible,
  mode,
  currentValue,
  onConfirm,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  // Date States
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Time States
  const [selectedHour, setSelectedHour] = useState(String(today.getHours()).padStart(2, '0'));
  const [selectedMinute, setSelectedMinute] = useState(
    String(Math.floor(today.getMinutes() / 5) * 5).padStart(2, '0')
  );

  // คำนวณจำนวนวันในเดือนนั้นๆ
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleConfirm = () => {
    if (mode === 'date') {
      const thaiYear = currentYear + 543;
      const formattedDate = `${selectedDay}/${currentMonth + 1}/${thaiYear}`;
      onConfirm(formattedDate);
    } else {
      const formattedTime = `${selectedHour}:${selectedMinute}`;
      onConfirm(formattedTime);
    }
    onClose();
  };

  // Quick Presets
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDay(d.getDate());
  };

  const setQuickTime = (hourStr: string, minStr: string) => {
    setSelectedHour(hourStr);
    setSelectedMinute(minStr);
  };

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header Title */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name={mode === 'date' ? 'calendar' : 'time'}
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {mode === 'date' ? 'เลือกวันที่' : 'เลือกเวลา'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {mode === 'date' ? (
            /* ================= DATE / CALENDAR VIEW ================= */
            <View style={styles.calendarContainer}>
              {/* Quick Presets Row */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickDate(0)}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>วันนี้</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickDate(1)}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>เมื่อวาน</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickDate(2)}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>2 วันที่แล้ว</Text>
                </TouchableOpacity>
              </View>

              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={handlePrevMonth}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.monthNavTitle, { color: colors.text }]}>
                  {THAI_MONTHS[currentMonth]} {currentYear + 543}
                </Text>

                <TouchableOpacity
                  style={[styles.navBtn, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={handleNextMonth}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Days of Week Header */}
              <View style={styles.weekHeaderRow}>
                {DAYS_OF_WEEK.map((d, idx) => (
                  <Text key={idx} style={[styles.weekDayText, { color: idx === 0 ? '#EF4444' : colors.textSecondary }]}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Calendar Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty slots before day 1 */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.dayCell} />
                ))}

                {/* Actual Days 1..daysInMonth */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = dayNum === selectedDay;
                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[
                        styles.dayCell,
                        isSelected && [styles.selectedDayCell, { backgroundColor: colors.primary }],
                      ]}
                      onPress={() => setSelectedDay(dayNum)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected ? styles.selectedDayText : { color: colors.text },
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* ================= TIME PICKER VIEW ================= */
            <View style={styles.timeContainer}>
              {/* Quick Time Presets */}
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => {
                    const now = new Date();
                    setQuickTime(String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'));
                  }}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>ตอนนี้</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickTime('08', '30')}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>08:30 (เช้า)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickTime('12', '00')}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>12:00 (เที่ยง)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetChip, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
                  onPress={() => setQuickTime('17', '30')}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>17:30 (เย็น)</Text>
                </TouchableOpacity>
              </View>

              {/* Time Selection Display Box */}
              <View style={[styles.timeDisplayBox, { backgroundColor: isDark ? colors.surfaceAlt : '#FFF7ED', borderColor: colors.primaryBorder }]}>
                <Text style={[styles.timeDisplayHuge, { color: colors.primary }]}>
                  {selectedHour}:{selectedMinute} น.
                </Text>
              </View>

              <View style={styles.timeSelectorsRow}>
                {/* Hours Column */}
                <View style={styles.timeCol}>
                  <Text style={[styles.colTitle, { color: colors.textSecondary }]}>ชั่วโมง</Text>
                  <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.chipsWrap}>
                      {hoursList.map((h) => (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.timeItemChip,
                            selectedHour === h
                              ? [styles.activeTimeChip, { backgroundColor: colors.primary }]
                              : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
                          ]}
                          onPress={() => setSelectedHour(h)}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              selectedHour === h ? styles.activeTimeChipText : { color: colors.text },
                            ]}
                          >
                            {h}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Minutes Column */}
                <View style={styles.timeCol}>
                  <Text style={[styles.colTitle, { color: colors.textSecondary }]}>นาที</Text>
                  <ScrollView style={styles.colScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.chipsWrap}>
                      {minutesList.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.timeItemChip,
                            selectedMinute === m
                              ? [styles.activeTimeChip, { backgroundColor: colors.primary }]
                              : { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' },
                          ]}
                          onPress={() => setSelectedMinute(m)}
                        >
                          <Text
                            style={[
                              styles.timeChipText,
                              selectedMinute === m ? styles.activeTimeChipText : { color: colors.text },
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons: ยกเลิก & ยืนยัน */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn, { backgroundColor: isDark ? colors.surfaceAlt : '#F1F5F9' }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>ยกเลิก</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.88}
            >
              <Text style={styles.confirmBtnText}>ตกลง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarContainer: {},
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 4,
  },
  selectedDayCell: {},
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timeContainer: {},
  timeDisplayBox: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  timeDisplayHuge: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timeSelectorsRow: {
    flexDirection: 'row',
    gap: 12,
    height: 160,
  },
  timeCol: {
    flex: 1,
  },
  colTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  colScroll: {
    flex: 1,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  timeItemChip: {
    width: 44,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTimeChip: {},
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeTimeChipText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {},
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
