import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { sfx } from '../services/sfx';

const AVATARS = [
  { name: "Neon Ghost", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPbjxzAh5FkZCY_nu3NxevRphunGV64g2443VywMC1fS-smMVDJ0eqoP5uR-xkzI_0aljJI5EyglkU0sIL64ZYdEdsXwCzv1vlnhuLC7H3z_MPW9cq_w5FUqQ6HOjfceCmJ_DFmP3EAN0IspsfTsc-cxfM8KPBfr-VI4aHDNMd8Rwwo0XYff2CDfAOjpqVW2kMkdnCuKEuTtbeIKmEQ6oOWz14AAVH9OFEYkojndsLdpVPO1yuOx-AzZVixGrxBQ9uFrFU4ilp6f--" },
  { name: "Viper 99", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCby83oI4tck_gLxdndmcWKao-SaUtJ1BdDOwHUZaMQXglpXtZ1fqtc6fde3khK1WyVVVxrLUBBRSAJKNYCCIYadfTqIajXwuOAUbK2Cw8LcisjRanEv27s7SvOqSQz_ZbSn3fFNBy5na9_gzj93X24NhMH8i_eB17Oqcgy0GHbclqLLGWQEmpzrOoE1CCV4h_Hcgg8byOTzxZndSVBLsiLJN7asdDQKgoz7h_BZqU2pA-F0c3r-0_z1vlBKPXnpwxBnaQ-VIU3WCFq" },
  { name: "Aria Flux", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUFyt1hchKLvy3teUXjD0ury1bpwORkFG9PlOXckMHQu1BuLXJAzc6IKiApFUkR43Fyzall7zWJiDc9XNez6_9Hn_96gx8rAOusmO3JxLWMounzePC58FjmkUI0cyT6PA3gaMmZpc7FIDHRuAqwGhQ3UAKtdyNAdTGhmidJFN39oB8NwskBNu3I-9p5lw1CzObrFeyeRLWA4gtJ-2tznOfxg3_SvnyuN6xA6qqXMKwZ3e1ZV6ecboZ_Xbv1jKw2kQW002T7YX8aJSU" },
  { name: "Card King", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-JklfANT-Z9BMvdJr9Kv1wEN4nE4dKCv94STFUBR243sLsLfjKwwIkEMURVWQayWGmHgsB7V_0sZbstx3_F_6bTNFIFVjEDArVsu6T02t8BbUEHtEGhxqgToc_ekTd0ZxP0TYtGIK1BRlHdj_aRgNb2nfRAVdXgjNjP6-GEB8n1bNhUR2T9H9J21xbhVM5o-OxCWZIpT62W5JG4B6Rm9-OskTyvkIypxDLY73qPa1Iw0iNgUNw-Yu6IskymYQyLbi47MqYZB0UJwP" },
  { name: "Luna 7", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBayMwbTiPOzu-wwzpwQhiKEVy09cK48cEaLwYzsLnT2VTp6IVJFWHM6O3eK-P3blJ-Be2WxOWbj_HKxSqqC6tChYAJhBsFMqj4dpPWk60JtAC-W_yPNKb6BOA1PMNUdbGdDJ6CZqjHdidP0P_SYPcvAZ8QNMdaWZxfFsZXf5LUAX7dsSjjmDp9Ntw89vlFa9OlkAdEqTzQEyuYdTH2fZQvK5ziIpDPJhsIoVwf3a-9xXq6EvYWNC6AV73mcV_s-4caCu5Pir7s3vC0" },
  { name: "Ace King", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCs394ZHVhhVlPFvJoLP04axrkwT56yhfZQsWk2intKH1gVR7RaucsBlAKg7LK-8xyLJzP7pZPYmpvYQerB7y_dVjQPKGXv88fBhs4OnQwcK0cdLCRV7CFw9L3K37TMl9axmtf3Zw-3-6RmMkFl0dpqR3pRixnaSY5uvCfRYIW1EZiBwsbaLQnE5uDsFrVVj_cMvCr7FRlAgP-04-F62pnVCvLaqwScZUz7urpsKGk3lrw-sfiWIve3tQQt4-NGRwAY-pmQAUn-4LQh" },
  { name: "Lucky J", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM8S45GipDblpLeUtIM1yxMundt6RSd9DuB32kgYWBAnqxtz_qx4uhjAdQc6dyp1gKlDAaCDDJmdhvl2jnwf4yL_RWPd9bHEtTYfclwkgY1kM_iargkbJVeFfB7eSudnSDXYiuXriAxmMJxLKSkDVtkm9M7NhilXGDWhCEsEAHZxHFiq9bI7Yz98EyjqgVHtifFJN49dtfNHaRv9QYjq2pbEe1YgrfzE19SjVGM6V7Du_1wxJLv2CHb4hdrXDeMVaxq3opZLPvU0k0" }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentAvatar = AVATARS[avatarIndex];

  const changeAvatar = (dir: number) => {
    sfx.playTick();
    setAvatarIndex((prev) => (prev + dir + AVATARS.length) % AVATARS.length);
  };

  const handleCreateRoom = async () => {
    sfx.playTick();
    const nameTrim = username.trim();
    if (!nameTrim) {
      setError("Please enter a callsign.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Authenticate user
      await api.guestLogin(nameTrim, currentAvatar.url);
      // 2. Create room
      const room = await api.createRoom();
      navigate(`/lobby/${room.code}`);
    } catch (err: any) {
      setError(err.message || "Failed to create operations room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    sfx.playTick();
    const nameTrim = username.trim();
    const codeTrim = roomCode.trim().toUpperCase();

    if (!nameTrim) {
      setError("Please enter a callsign.");
      return;
    }
    if (!codeTrim || codeTrim.length !== 6) {
      setError("Please enter a 6-digit room code.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Authenticate user
      await api.guestLogin(nameTrim, currentAvatar.url);
      // 2. Join room
      const room = await api.joinRoom(codeTrim);
      navigate(`/lobby/${room.code}`);
    } catch (err: any) {
      setError(err.message || "Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="felt-texture h-full w-full flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[#0e0e0f]/50 backdrop-blur-[2px] z-0" />
      
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm md:max-w-md glass-panel rounded-3xl p-6 md:p-8 flex flex-col items-center z-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/5"
      >
        {/* Header Branding */}
        <h1 className="font-headline font-black text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-electricBlue via-[#60a5fa] to-crimson italic tracking-tighter uppercase mb-6 animate-pulse select-none">
          BURST
        </h1>

        {error && (
          <div className="bg-crimson/10 border border-crimson/20 rounded-xl px-4 py-2.5 text-xs text-crimson mb-4 text-center w-full">
            {error}
          </div>
        )}

        {/* Callsign Field */}
        <div className="w-full mb-5">
          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-2">
            Tactical Callsign
          </label>
          <input
            type="text"
            placeholder="Enter Name..."
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 15))}
            disabled={loading}
            className="w-full bg-[#1b1b1d]/80 border border-outline-variant/35 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-electricBlue focus:shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all font-mono placeholder:text-zinc-600"
          />
        </div>

        {/* Avatar Selection Carousel */}
        <div className="w-full flex flex-col items-center mb-6">
          <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant font-mono font-bold mb-3 self-start">
            Select Avatar Profile
          </label>

          <div className="flex items-center gap-5 justify-between w-full max-w-[260px] md:max-w-[280px]">
            <button
              onClick={() => changeAvatar(-1)}
              disabled={loading}
              className="text-primary hover:text-white transition-colors h-9 w-9 flex items-center justify-center rounded-full bg-charcoal border border-outline-variant/25 hover:border-electricBlue active:scale-90"
            >
              ←
            </button>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden bg-charcoal border-2 border-electricBlue shadow-[0_0_15px_rgba(59,130,246,0.25)] relative">
                <img src={currentAvatar.url} alt={currentAvatar.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-mono font-semibold text-white mt-2">
                {currentAvatar.name}
              </span>
            </div>
            <button
              onClick={() => changeAvatar(1)}
              disabled={loading}
              className="text-primary hover:text-white transition-colors h-9 w-9 flex items-center justify-center rounded-full bg-charcoal border border-outline-variant/25 hover:border-electricBlue active:scale-90"
            >
              →
            </button>
          </div>
        </div>

        {/* Play Commands */}
        <div className="w-full flex flex-col gap-3.5">
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-electricBlue to-[#1d4ed8] text-white font-headline text-sm font-bold uppercase tracking-wider py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center"
          >
            {loading ? 'Setting up Room...' : 'Create Table'}
          </button>

          <div className="flex items-center gap-3 py-1 w-full">
            <div className="h-px bg-outline-variant/30 flex-1" />
            <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-mono font-bold">OR</span>
            <div className="h-px bg-outline-variant/30 flex-1" />
          </div>

          <div className="flex gap-2 w-full">
            <input
              type="text"
              placeholder="ROOM CODE"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              disabled={loading}
              className="w-2/5 bg-[#1b1b1d]/80 border border-outline-variant/35 text-white rounded-xl px-2 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-electricBlue placeholder:text-zinc-600 focus:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            />
            <button
              onClick={handleJoinRoom}
              disabled={loading}
              className="flex-1 bg-charcoal border border-outline-variant/35 hover:border-electricBlue/50 text-white font-headline text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl active:scale-95 transition-all"
            >
              Join Table
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Home;
