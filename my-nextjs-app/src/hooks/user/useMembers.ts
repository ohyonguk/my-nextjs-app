import { useState, useEffect, useCallback } from 'react';
import { memberService, Member, CreateMemberData, UpdateMemberData } from '../../services/user/memberService';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모든 회원 조회
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await memberService.getAllMembers();
      setMembers(data);
    } catch (err) {
      setError('회원 목록을 불러오는데 실패했습니다.');
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 새 회원 생성
  const createMember = useCallback(async (memberData: CreateMemberData) => {
    setLoading(true);
    setError(null);
    try {
      const newMember = await memberService.createMember(memberData);
      setMembers(prev => [...prev, newMember]);
      return newMember;
    } catch (err) {
      setError('회원 생성에 실패했습니다.');
      console.error('Failed to create member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 회원 정보 수정
  const updateMember = useCallback(async (id: number, memberData: UpdateMemberData) => {
    setLoading(true);
    setError(null);
    try {
      const updatedMember = await memberService.updateMember(id, memberData);
      if (updatedMember) {
        setMembers(prev => 
          prev.map(member => 
            member.id === id ? updatedMember : member
          )
        );
      }
      return updatedMember;
    } catch (err) {
      setError('회원 정보 수정에 실패했습니다.');
      console.error('Failed to update member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 회원 삭제
  const deleteMember = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const success = await memberService.deleteMember(id);
      if (success) {
        setMembers(prev => prev.filter(member => member.id !== id));
      }
      return success;
    } catch (err) {
      setError('회원 삭제에 실패했습니다.');
      console.error('Failed to delete member:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 이메일로 회원 검색
  const searchMembersByEmail = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const filteredMembers = await memberService.searchMembersByEmail(email);
      setMembers(filteredMembers);
    } catch (err) {
      setError('회원 검색에 실패했습니다.');
      console.error('Failed to search members:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 역할별 회원 조회
  const getMembersByRole = useCallback(async (role: string) => {
    setLoading(true);
    setError(null);
    try {
      const filteredMembers = await memberService.getMembersByRole(role);
      setMembers(filteredMembers);
    } catch (err) {
      setError('역할별 회원 조회에 실패했습니다.');
      console.error('Failed to get members by role:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 회원 목록 조회
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    searchMembersByEmail,
    getMembersByRole
  };
} 