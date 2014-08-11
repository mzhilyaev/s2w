#!/usr/bin/perl
# generate Bockers.js file for s2w
# to run 
# git clone git@github.com:monicachew/abp-hostblocking.git
# cd abp-hostblocking
# run make
# modify handler_abp.py to print offending urls to stdout
#  diff --git a/handler_abp.py b/handler_abp.py
#  index f5c454b..f301e80 100644
#  --- a/handler_abp.py
#  +++ b/handler_abp.py
#  @@ -316,7 +316,7 @@ def find_hosts(filename, f_out, f_dbg, f_log, chunk):
#           # book keeping
#           domain_dict[match_s] = 1;
#   
#  -        #f_out.write("%s\n" % (match_s, ))
#  +        sys.stdout.write("%s\n" % (match_s, ))
#           output_dbg.append(hashlib.sha256(match_s).hexdigest());
#           output.append(hashlib.sha256(match_s).digest());
#  
#
# ./lists2safebrowsing.py tmp_in/abp tmp_out/abp/mozpub-track-digest256 > blockers.txt
# now run genBlockers.js 
# genBlockers.js blockers.txt > Blockers.js
#

use strict;
use Data::Dumper;
use JSON;

my $hosts = {};

### open blockers file
open(BLOCKERS, "< @ARGV[0]") || die("failed to open @ARGV[0]");
while (<BLOCKERS>) {
  chomp($_);
  $_ =~ s/\// \//;
  $_ =~ s/[?].*$//;
  my ($host, $path) = split(/ /,$_);
  if (!$hosts->{$host}) {
    $hosts->{$host} = [];
  }
  push @{$hosts->{$host}}, $path;
}

#print Dumper($hosts);

### print to stdout
my $json = new JSON;
$json->pretty( 1 );
print "exports.Blockers = ";
print $json->encode( $hosts ).";\n";
